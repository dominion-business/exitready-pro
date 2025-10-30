from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, ValuationHistory
from app.models.valuation import Valuation, IndustryMultiple
from app.models.business import Business
from app.services.valuation_engine import ValuationEngine
from app.utils.validation import validate_positive_number, validate_percentage
from datetime import datetime
import statistics
import json
import logging
import sys

logger = logging.getLogger(__name__)
        
valuation_bp = Blueprint('valuation', __name__, url_prefix='/api/valuation')


@valuation_bp.route('/industries', methods=['GET'])
#@jwt_required() # ← Commented out for testing
def get_industries():
    """Get list of all industries with their multiples"""
    try:
        industries = IndustryMultiple.query.all()
        return jsonify({
            'industries': [industry.to_dict() for industry in industries]
        }), 200
    except Exception as e:
        print(f"Error fetching industries: {str(e)}", file=sys.stderr)
        return jsonify({'error': 'Failed to fetch industries'}), 500


@valuation_bp.route('/industry/<int:industry_id>', methods=['GET'])
@jwt_required()
def get_industry(industry_id):
    """Get specific industry multiples"""
    try:
        industry = IndustryMultiple.query.get(industry_id)
        if not industry:
            return jsonify({'error': 'Industry not found'}), 404
        
        return jsonify(industry.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@valuation_bp.route('/calculate', methods=['POST'])
@jwt_required()
def calculate_valuation():
    """Calculate business valuation using selected method(s)"""
    logger.info("Valuation calculation endpoint called")

    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        logger.info(f"Valuation calculation for user: {user_id}")

        # Validate and extract inputs
        method = data.get('method', 'comprehensive')

        # Validate financial inputs
        valid, revenue = validate_positive_number(data.get('revenue', 0), 'Revenue')
        if not valid:
            return revenue  # This is the error response

        valid, ebitda = validate_positive_number(data.get('ebitda', 0), 'EBITDA')
        if not valid:
            return ebitda

        valid, net_income = validate_positive_number(data.get('net_income', 0), 'Net Income')
        if not valid:
            return net_income

        # Cash flow defaults to EBITDA * 0.8 if not provided
        cash_flow_input = data.get('cash_flow', ebitda * 0.8 if ebitda else 0)
        valid, cash_flow = validate_positive_number(cash_flow_input, 'Cash Flow')
        if not valid:
            return cash_flow

        valid, total_assets = validate_positive_number(data.get('total_assets', 0), 'Total Assets')
        if not valid:
            return total_assets

        valid, total_liabilities = validate_positive_number(data.get('total_liabilities', 0), 'Total Liabilities')
        if not valid:
            return total_liabilities

        industry_id = data.get('industry_id')

        # Validate private company discount (0-1 range)
        private_discount_input = data.get('private_company_discount', 0.25)
        valid, private_discount = validate_percentage(private_discount_input, 'Private company discount')
        if not valid:
            return private_discount

        logger.info(f"Private company discount: {private_discount*100}%")

        # Optional DCF parameters - use defaults if not provided
        growth_rates = data.get('growth_rates', [0.15, 0.12, 0.10, 0.08, 0.05])

        # Validate discount rate
        discount_rate_input = data.get('discount_rate', 0.15)
        valid, discount_rate = validate_percentage(discount_rate_input, 'Discount rate')
        if not valid:
            return discount_rate
        
        # Get industry multiples
        industry_multiples = {}
        if industry_id:
            industry = IndustryMultiple.query.get(industry_id)
            if industry:
                industry_multiples = {
                    'ev_ebitda': {
                        'low': industry.ev_ebitda_low,
                        'median': industry.ev_ebitda_median,
                        'high': industry.ev_ebitda_high
                    },
                    'ev_revenue': {
                        'low': industry.ev_revenue_low,
                        'median': industry.ev_revenue_median,
                        'high': industry.ev_revenue_high
                    },
                    'pe': {
                        'low': industry.pe_low,
                        'median': industry.pe_median,
                        'high': industry.pe_high
                    },
                    'rule_of_thumb': industry.rule_of_thumb
                }
        
        # Initialize valuation engine
        engine = ValuationEngine()
        
        # Calculate based on method
        if method == 'cca':
            # NEW: Apply custom discount
            original_discount = engine.PRIVATE_COMPANY_DISCOUNT
            engine.PRIVATE_COMPANY_DISCOUNT = private_discount
            results = engine.calculate_cca(revenue, ebitda, net_income, industry_multiples)
            engine.PRIVATE_COMPANY_DISCOUNT = original_discount
        elif method == 'dcf':
            results = engine.calculate_dcf(cash_flow, growth_rates, discount_rate)
        elif method == 'capitalization':
            results = engine.calculate_capitalization_of_earnings(ebitda, industry_multiples=industry_multiples)
        elif method == 'nav':
            results = engine.calculate_nav(total_assets, total_liabilities)
        elif method == 'manual':
            # Validate manual multiple input
            manual_multiple_input = data.get('manual_multiple', 0)
            if not manual_multiple_input or float(manual_multiple_input) <= 0:
                return jsonify({'error': 'Manual multiple must be a positive number'}), 400

            manual_multiple = float(manual_multiple_input)
            manual_multiple_type = data.get('manual_multiple_type', 'ev_ebitda')

            # Validate multiple type
            valid_types = ['ev_ebitda', 'ev_revenue', 'pe']
            if manual_multiple_type not in valid_types:
                return jsonify({'error': f'Invalid multiple type. Must be one of: {", ".join(valid_types)}'}), 400

            logger.info(f"Manual multiple calculation: {manual_multiple}x {manual_multiple_type} with {private_discount*100}% discount")

            # Apply custom discount (same pattern as CCA)
            original_discount = engine.PRIVATE_COMPANY_DISCOUNT
            engine.PRIVATE_COMPANY_DISCOUNT = private_discount
            results = engine.calculate_manual_multiple(revenue, ebitda, net_income, manual_multiple, manual_multiple_type)
            engine.PRIVATE_COMPANY_DISCOUNT = original_discount

            # Check if calculation succeeded
            if results.get('details', {}).get('error'):
                return jsonify({'error': results['details']['error']}), 400
        else:  # comprehensive - run all applicable methods
            print(f"DEBUG: Running comprehensive valuation", file=sys.stderr)
            print(f"DEBUG: revenue={revenue}, ebitda={ebitda}, net_income={net_income}", file=sys.stderr)
            print(f"DEBUG: cash_flow={cash_flow}, assets={total_assets}, liab={total_liabilities}", file=sys.stderr)
            
            results = {
                'method': 'comprehensive',
                'methods': {},
                'summary': {}
            }
            
            valuations = []
            weights = []
            
            # CCA - NEW: Apply custom discount
            if ebitda > 0 and industry_multiples:
                try:
                    print(f"DEBUG: Attempting CCA calculation with {private_discount*100}% discount", file=sys.stderr)
                    # Temporarily override discount
                    original_discount = engine.PRIVATE_COMPANY_DISCOUNT
                    engine.PRIVATE_COMPANY_DISCOUNT = private_discount
                    cca = engine.calculate_cca(revenue, ebitda, net_income, industry_multiples)
                    engine.PRIVATE_COMPANY_DISCOUNT = original_discount
                    
                    results['methods']['cca'] = cca
                    if cca.get('recommended'):
                        valuations.append(cca['recommended'])
                        weights.append(0.35)
                        print(f"DEBUG: CCA successful: {cca['recommended']}", file=sys.stderr)
                except Exception as e:
                    print(f"CCA calculation error: {str(e)}", file=sys.stderr)
                    import traceback
                    traceback.print_exc(file=sys.stderr)
            
            # DCF - FIXED: proper growth rates
            if cash_flow > 0:
                try:
                    print(f"DEBUG: Attempting DCF calculation", file=sys.stderr)
                    dcf = engine.calculate_dcf(cash_flow, growth_rates, discount_rate)
                    results['methods']['dcf'] = dcf
                    if dcf.get('recommended'):
                        valuations.append(dcf['recommended'])
                        weights.append(0.35)
                        print(f"DEBUG: DCF successful: {dcf['recommended']}", file=sys.stderr)
                except Exception as e:
                    print(f"DCF calculation error: {str(e)}", file=sys.stderr)
                    import traceback
                    traceback.print_exc(file=sys.stderr)
            
            # Capitalization of Earnings
            if ebitda > 0:
                try:
                    print(f"DEBUG: Attempting Capitalization calculation", file=sys.stderr)
                    cap = engine.calculate_capitalization_of_earnings(ebitda, industry_multiples=industry_multiples)
                    results['methods']['capitalization'] = cap
                    if cap.get('recommended'):
                        valuations.append(cap['recommended'])
                        weights.append(0.20)
                        print(f"DEBUG: Capitalization successful: {cap['recommended']}", file=sys.stderr)
                except Exception as e:
                    print(f"Capitalization calculation error: {str(e)}", file=sys.stderr)
                    import traceback
                    traceback.print_exc(file=sys.stderr)
            
            # NAV
            if total_assets > 0:
                try:
                    print(f"DEBUG: Attempting NAV calculation", file=sys.stderr)
                    nav = engine.calculate_nav(total_assets, total_liabilities)
                    results['methods']['nav'] = nav
                    if nav.get('recommended'):
                        valuations.append(nav['recommended'])
                        weights.append(0.10)
                        print(f"DEBUG: NAV successful: {nav['recommended']}", file=sys.stderr)
                except Exception as e:
                    print(f"NAV calculation error: {str(e)}", file=sys.stderr)
                    import traceback
                    traceback.print_exc(file=sys.stderr)
            
            print(f"DEBUG: Total valuations calculated: {len(valuations)}", file=sys.stderr)
            print(f"DEBUG: Valuations: {valuations}", file=sys.stderr)
            
            # Calculate weighted average
            if valuations:
                total_weight = sum(weights)
                normalized_weights = [w / total_weight for w in weights]
                weighted_avg = sum(v * w for v, w in zip(valuations, normalized_weights))
                
                results['summary'] = {
                    'weighted_average': weighted_avg,
                    'simple_average': sum(valuations) / len(valuations),
                    'min_valuation': min(valuations),
                    'max_valuation': max(valuations),
                    'methods_used': len(valuations),
                    'private_discount_applied': private_discount  # NEW: Store discount used
                }
                
                results['recommended'] = weighted_avg
                results['low_range'] = min(valuations)
                results['high_range'] = max(valuations)
                
                print(f"DEBUG: Final valuation: {weighted_avg}", file=sys.stderr)
            else:
                print(f"DEBUG: No valuations calculated - insufficient data", file=sys.stderr)
                return jsonify({'error': 'Unable to calculate valuation with provided data. Please ensure you have revenue, EBITDA, and selected an industry.'}), 400
        
        # Extract final valuation
        valuation_amount = results.get('recommended') or results.get('recommended_valuation', 0)
        low_range = results.get('low_range')
        high_range = results.get('high_range')
        
        # Save to database
        valuation = Valuation(
            user_id=int(user_id),
            method=method,
            input_data=json.dumps(data),
            valuation_amount=valuation_amount,
            low_range=low_range,
            high_range=high_range,
            calculation_details=json.dumps(results)
        )
        
        db.session.add(valuation)
        db.session.commit()
        
        print(f"Valuation saved with ID: {valuation.id}", file=sys.stderr)
        print(f"Calculated valuation: ${valuation_amount:,.0f}", file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)
        
        return jsonify({
            'valuation_id': valuation.id,
            'valuation_amount': valuation_amount,
            'low_range': low_range,
            'high_range': high_range,
            'method': method,
            'results': results
        }), 201
        
    except Exception as e:
        print(f"VALUATION ERROR: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@valuation_bp.route('/advanced', methods=['POST'])
@jwt_required()
def calculate_advanced_valuation():
    """
    Calculate comprehensive valuation using multi-year financial data
    Considers historical trends, growth rates, and add-backs
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Extract industry and discount settings
        industry_id = data.get('industry_id')
        private_discount = data.get('private_company_discount', 0.25)  # Default 25%

        # Fetch industry multiples if industry provided
        industry_multiples = None
        if industry_id:
            try:
                industry = IndustryMultiple.query.get(industry_id)
                if industry:
                    # Apply private company discount to public multiples
                    industry_multiples = {
                        'ev_ebitda': industry.ev_ebitda_median * (1 - private_discount),
                        'ev_revenue': industry.ev_revenue_median * (1 - private_discount),
                        'pe': industry.pe_median * (1 - private_discount),
                        'industry_name': industry.industry_name
                    }
            except Exception as e:
                print(f"Error fetching industry: {e}")

        # Extract multi-year data
        years = sorted([k for k in data.get('revenue', {}).keys()])
        
        if len(years) < 2:
            return jsonify({'error': 'At least 2 years of data required'}), 400
        
        # Helper function to get year data safely
        def get_year_values(field):
            return [float(data.get(field, {}).get(year, 0) or 0) for year in years]
        
        # Extract financial metrics
        revenues = get_year_values('revenue')
        ebitdas = get_year_values('ebitda')
        sdes = get_year_values('sde')
        gross_profits = get_year_values('gross_profit')
        total_assets = get_year_values('total_assets')
        total_liabilities = get_year_values('total_liabilities_equity')
        
        # Calculate growth rates
        def calculate_cagr(values):
            """Calculate Compound Annual Growth Rate"""
            if not values or len(values) < 2 or values[0] == 0:
                return 0
            first_value = values[0]
            last_value = values[-1]
            num_years = len(values) - 1
            
            if first_value <= 0 or last_value <= 0:
                return 0
            
            return ((last_value / first_value) ** (1 / num_years) - 1) * 100
        
        revenue_cagr = calculate_cagr(revenues)
        ebitda_cagr = calculate_cagr(ebitdas)
        sde_cagr = calculate_cagr(sdes)
        
        # Use most recent year as base
        current_revenue = revenues[-1] if revenues else 0
        current_ebitda = ebitdas[-1] if ebitdas else 0
        current_sde = sdes[-1] if sdes else 0
        current_assets = total_assets[-1] if total_assets else 0
        current_liabilities = total_liabilities[-1] if total_liabilities else 0
        
        # Calculate averages for stability analysis
        avg_revenue = statistics.mean([r for r in revenues if r > 0]) if any(r > 0 for r in revenues) else 0
        avg_ebitda = statistics.mean([e for e in ebitdas if e > 0]) if any(e > 0 for e in ebitdas) else 0
        avg_sde = statistics.mean([s for s in sdes if s > 0]) if any(s > 0 for s in sdes) else 0
        
        # Calculate EBITDA margin trend
        ebitda_margins = []
        for i in range(len(years)):
            if revenues[i] > 0 and ebitdas[i] >= 0:
                ebitda_margins.append((ebitdas[i] / revenues[i]) * 100)

        avg_ebitda_margin = statistics.mean(ebitda_margins) if len(ebitda_margins) > 0 else 0
        
        # ========================================
        # VALUATION CALCULATIONS
        # ========================================
        
        valuations = {}
        
        # 1. SDE Multiple Method (for smaller businesses)
        # SDE multiples typically range from 2.0x to 4.0x based on size and growth
        base_sde_multiple = 2.5
        
        # Adjust multiple based on growth
        if sde_cagr > 20:
            sde_growth_adjustment = 1.0
        elif sde_cagr > 10:
            sde_growth_adjustment = 0.5
        elif sde_cagr > 0:
            sde_growth_adjustment = 0.25
        else:
            sde_growth_adjustment = -0.5
        
        # Adjust for size (larger businesses get higher multiples)
        if current_sde > 2000000:
            sde_size_adjustment = 0.75
        elif current_sde > 1000000:
            sde_size_adjustment = 0.5
        elif current_sde > 500000:
            sde_size_adjustment = 0.25
        else:
            sde_size_adjustment = 0
        
        final_sde_multiple = base_sde_multiple + sde_growth_adjustment + sde_size_adjustment
        final_sde_multiple = max(1.5, min(final_sde_multiple, 5.0))  # Cap between 1.5x and 5.0x
        
        sde_valuation = current_sde * final_sde_multiple
        
        valuations['sde_method'] = {
            'value': sde_valuation,
            'multiple': final_sde_multiple,
            'base_metric': current_sde,
            'description': f'SDE Multiple Method: ${current_sde:,.0f} × {final_sde_multiple:.2f}x'
        }
        
        # 2. EBITDA Multiple Method - UPDATE THIS SECTION
        if industry_multiples and industry_multiples['ev_ebitda'] > 0:
            # Use industry-specific multiple with adjustments
            base_ebitda_multiple = industry_multiples['ev_ebitda']
            
            # Still apply growth adjustments
            if ebitda_cagr > 20:
                ebitda_growth_adjustment = 2.0
            elif ebitda_cagr > 10:
                ebitda_growth_adjustment = 1.0
            elif ebitda_cagr > 5:
                ebitda_growth_adjustment = 0.5
            else:
                ebitda_growth_adjustment = 0
            
            # Margin adjustment
            if avg_ebitda_margin > 25:
                margin_adjustment = 1.0
            elif avg_ebitda_margin > 15:
                margin_adjustment = 0.5
            else:
                margin_adjustment = 0
            
            final_ebitda_multiple = base_ebitda_multiple + ebitda_growth_adjustment + margin_adjustment
            final_ebitda_multiple = max(base_ebitda_multiple * 0.5, min(final_ebitda_multiple, base_ebitda_multiple * 2.0))
        else:
            # Fallback to generic multiples if no industry selected
            base_ebitda_multiple = 4.0
            
            if ebitda_cagr > 20:
                ebitda_growth_adjustment = 2.0
            elif ebitda_cagr > 10:
                ebitda_growth_adjustment = 1.0
            elif ebitda_cagr > 5:
                ebitda_growth_adjustment = 0.5
            else:
                ebitda_growth_adjustment = 0
            
            if avg_ebitda_margin > 25:
                margin_adjustment = 1.0
            elif avg_ebitda_margin > 15:
                margin_adjustment = 0.5
            else:
                margin_adjustment = 0
            
            final_ebitda_multiple = base_ebitda_multiple + ebitda_growth_adjustment + margin_adjustment
            final_ebitda_multiple = max(3.0, min(final_ebitda_multiple, 10.0))

        ebitda_valuation = current_ebitda * final_ebitda_multiple

        valuations['ebitda_method'] = {
            'value': ebitda_valuation,
            'multiple': final_ebitda_multiple,
            'base_metric': current_ebitda,
            'industry_multiple_used': industry_multiples['ev_ebitda'] if industry_multiples else None,
            'description': f'EBITDA Multiple Method: ${current_ebitda:,.0f} × {final_ebitda_multiple:.2f}x' + 
                        (f' (Industry: {industry_multiples["industry_name"]})' if industry_multiples else '')
        }

        # 3. Revenue Multiple Method - UPDATE THIS SECTION  
        if industry_multiples and industry_multiples['ev_revenue'] > 0:
            # Use industry-specific revenue multiple
            base_revenue_multiple = industry_multiples['ev_revenue']
            
            # Profitability adjustment
            if avg_ebitda_margin > 20:
                revenue_profit_adjustment = base_revenue_multiple * 0.5
            elif avg_ebitda_margin > 10:
                revenue_profit_adjustment = base_revenue_multiple * 0.25
            else:
                revenue_profit_adjustment = 0
            
            # Growth adjustment
            if revenue_cagr > 25:
                revenue_growth_adjustment = base_revenue_multiple * 0.5
            elif revenue_cagr > 15:
                revenue_growth_adjustment = base_revenue_multiple * 0.25
            else:
                revenue_growth_adjustment = 0
            
            final_revenue_multiple = base_revenue_multiple + revenue_profit_adjustment + revenue_growth_adjustment
            final_revenue_multiple = max(base_revenue_multiple * 0.5, min(final_revenue_multiple, base_revenue_multiple * 3.0))
        else:
            # Fallback to generic
            base_revenue_multiple = 0.5
            
            if avg_ebitda_margin > 20:
                revenue_profit_adjustment = 1.0
            elif avg_ebitda_margin > 10:
                revenue_profit_adjustment = 0.5
            else:
                revenue_profit_adjustment = 0
            
            if revenue_cagr > 25:
                revenue_growth_adjustment = 1.0
            elif revenue_cagr > 15:
                revenue_growth_adjustment = 0.5
            else:
                revenue_growth_adjustment = 0
            
            final_revenue_multiple = base_revenue_multiple + revenue_profit_adjustment + revenue_growth_adjustment
            final_revenue_multiple = max(0.3, min(final_revenue_multiple, 3.0))

        revenue_valuation = current_revenue * final_revenue_multiple

        valuations['revenue_method'] = {
            'value': revenue_valuation,
            'multiple': final_revenue_multiple,
            'base_metric': current_revenue,
            'industry_multiple_used': industry_multiples['ev_revenue'] if industry_multiples else None,
            'description': f'Revenue Multiple Method: ${current_revenue:,.0f} × {final_revenue_multiple:.2f}x' +
                        (f' (Industry: {industry_multiples["industry_name"]})' if industry_multiples else '')
        }
        
        # 4. Asset-Based Method
        net_assets = current_assets - current_liabilities
        
        # Apply a premium/discount based on profitability
        if avg_ebitda_margin > 15:
            asset_adjustment = 1.5  # 50% premium for profitable business
        elif avg_ebitda_margin > 5:
            asset_adjustment = 1.25  # 25% premium
        else:
            asset_adjustment = 1.0  # No premium
        
        asset_valuation = net_assets * asset_adjustment
        
        valuations['asset_method'] = {
            'value': asset_valuation,
            'net_assets': net_assets,
            'adjustment_factor': asset_adjustment,
            'description': f'Asset-Based Method: ${net_assets:,.0f} × {asset_adjustment:.2f}x adjustment'
        }
        
        # 5. Discounted Cash Flow (DCF) - Simplified
        # Project next 5 years based on historical growth
        projection_years = 5
        discount_rate = 0.15  # 15% discount rate for private companies
        terminal_growth_rate = 0.03  # 3% perpetual growth
        
        # Use SDE as cash flow proxy
        projected_cash_flows = []
        annual_growth = sde_cagr / 100 if sde_cagr > 0 else 0.05  # Use 5% if negative growth
        
        for year in range(1, projection_years + 1):
            projected_cf = current_sde * ((1 + annual_growth) ** year)
            discounted_cf = projected_cf / ((1 + discount_rate) ** year)
            projected_cash_flows.append(discounted_cf)
        
        # Terminal value
        terminal_cf = current_sde * ((1 + annual_growth) ** projection_years) * (1 + terminal_growth_rate)
        terminal_value = terminal_cf / (discount_rate - terminal_growth_rate)
        discounted_terminal_value = terminal_value / ((1 + discount_rate) ** projection_years)
        
        dcf_valuation = sum(projected_cash_flows) + discounted_terminal_value
        
        valuations['dcf_method'] = {
            'value': dcf_valuation,
            'projected_cash_flows': projected_cash_flows,
            'terminal_value': discounted_terminal_value,
            'description': f'DCF Method: 5-year projection at {annual_growth*100:.1f}% growth'
        }
        
        # ========================================
        # WEIGHTED AVERAGE VALUATION
        # ========================================
        
        # Determine weights based on business characteristics
        weights = {}
        
        # For smaller businesses (SDE < $500k), weight SDE method more heavily
        if current_sde < 500000:
            weights['sde_method'] = 0.40
            weights['ebitda_method'] = 0.20
            weights['revenue_method'] = 0.15
            weights['asset_method'] = 0.15
            weights['dcf_method'] = 0.10
        # For mid-sized businesses
        elif current_sde < 2000000:
            weights['sde_method'] = 0.25
            weights['ebitda_method'] = 0.30
            weights['revenue_method'] = 0.15
            weights['asset_method'] = 0.10
            weights['dcf_method'] = 0.20
        # For larger businesses
        else:
            weights['sde_method'] = 0.15
            weights['ebitda_method'] = 0.35
            weights['revenue_method'] = 0.15
            weights['asset_method'] = 0.10
            weights['dcf_method'] = 0.25
        
        # Calculate weighted average
        weighted_valuation = sum(
            valuations[method]['value'] * weights[method]
            for method in weights.keys()
        )
        
        # Calculate range (min/max)
        all_values = [v['value'] for v in valuations.values() if v.get('value', 0) > 0]
        valuation_range = {
            'low': min(all_values) if len(all_values) > 0 else 0,
            'high': max(all_values) if len(all_values) > 0 else 0,
            'average': statistics.mean(all_values) if len(all_values) > 0 else 0
        }
        
        # ========================================
        # ANALYSIS & INSIGHTS
        # ========================================
        
        insights = []
        
        # Growth insights
        if revenue_cagr > 15:
            insights.append({
                'type': 'positive',
                'category': 'Growth',
                'message': f'Strong revenue growth of {revenue_cagr:.1f}% CAGR increases valuation multiples'
            })
        elif revenue_cagr < 0:
            insights.append({
                'type': 'negative',
                'category': 'Growth',
                'message': f'Declining revenue ({revenue_cagr:.1f}% CAGR) reduces valuation multiples'
            })
        
        # Profitability insights
        if avg_ebitda_margin > 20:
            insights.append({
                'type': 'positive',
                'category': 'Profitability',
                'message': f'Excellent EBITDA margin of {avg_ebitda_margin:.1f}% demonstrates strong profitability'
            })
        elif avg_ebitda_margin < 10:
            insights.append({
                'type': 'warning',
                'category': 'Profitability',
                'message': f'EBITDA margin of {avg_ebitda_margin:.1f}% is below industry average'
            })
        
        # Size insights
        if current_revenue > 10000000:
            insights.append({
                'type': 'positive',
                'category': 'Scale',
                'message': 'Business size supports higher valuation multiples'
            })
        
        # Trend consistency
        revenue_volatility = 0
        if len(revenues) > 1:
            valid_revenues = [r for r in revenues if r > 0]
            if len(valid_revenues) > 1:
                mean_revenue = statistics.mean(valid_revenues)
                if mean_revenue > 0:
                    revenue_volatility = statistics.stdev(valid_revenues) / mean_revenue
        if revenue_volatility < 0.15:
            insights.append({
                'type': 'positive',
                'category': 'Stability',
                'message': 'Consistent revenue trend increases buyer confidence'
            })
        elif revenue_volatility > 0.30:
            insights.append({
                'type': 'warning',
                'category': 'Stability',
                'message': 'High revenue volatility may concern potential buyers'
            })
        
        # ========================================
        # PREPARE RESPONSE
        # ========================================
        
        result = {
            'weighted_valuation': weighted_valuation,
            'valuation_range': valuation_range,
            'valuation_methods': valuations,
            'method_weights': weights,
            'growth_metrics': {
                'revenue_cagr': revenue_cagr,
                'ebitda_cagr': ebitda_cagr,
                'sde_cagr': sde_cagr
            },
            'financial_summary': {
                'current_year': {
                    'revenue': current_revenue,
                    'ebitda': current_ebitda,
                    'sde': current_sde,
                    'ebitda_margin': (current_ebitda / current_revenue * 100) if current_revenue > 0 else 0
                },
                'averages': {
                    'revenue': avg_revenue,
                    'ebitda': avg_ebitda,
                    'sde': avg_sde,
                    'ebitda_margin': avg_ebitda_margin
                }
            },
            'insights': insights,
            'calculation_date': datetime.utcnow().isoformat(),
            'years_analyzed': len(years)
        }
        
        # Include industry and discount info in response
        if industry_multiples:
            result['industry_info'] = {
                'name': industry_multiples['industry_name'],
                'original_multiples': {
                    'ev_ebitda': industry_multiples['ev_ebitda'] / (1 - private_discount),
                    'ev_revenue': industry_multiples['ev_revenue'] / (1 - private_discount),
                    'pe': industry_multiples['pe'] / (1 - private_discount)
                },
                'adjusted_multiples': industry_multiples,
                'private_discount_applied': private_discount * 100
            }

        # Save to history (optional)
        try:
            history_entry = ValuationHistory(
                user_id=user_id,
                valuation_data={
                    'type': 'advanced',
                    'weighted_valuation': weighted_valuation,
                    'range': valuation_range,
                    'years_analyzed': len(years)
                }
            )
            db.session.add(history_entry)
            db.session.commit()
        except Exception as history_error:
            print(f"Error saving history: {history_error}")
            # Continue even if history save fails
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Advanced valuation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Calculation failed: {str(e)}'}), 500

@valuation_bp.route('/history', methods=['GET'])
@jwt_required()
def get_valuation_history():
    """Get user's valuation history from both tables"""
    try:
        user_id = get_jwt_identity()
        
        # Get simple valuations from Valuation table
        simple_valuations = Valuation.query.filter_by(user_id=user_id)\
            .order_by(Valuation.created_at.desc())\
            .all()
        
        # Get advanced valuations from ValuationHistory table
        advanced_valuations = ValuationHistory.query.filter_by(user_id=user_id)\
            .order_by(ValuationHistory.created_at.desc())\
            .all()
        
        # Combine and format results
        all_valuations = []
        
        # Add simple valuations
        for val in simple_valuations:
            all_valuations.append({
                'id': val.id,
                'type': 'simple',
                'valuation_amount': val.valuation_amount,
                'method': val.method,
                'created_at': val.created_at.isoformat(),
                'low_range': val.low_range,
                'high_range': val.high_range
            })
        
        # Add advanced valuations
        for val in advanced_valuations:
            valuation_data = val.valuation_data
            all_valuations.append({
                'id': val.id,
                'type': 'advanced',
                'valuation_amount': valuation_data.get('weighted_valuation', 0),
                'method': 'Multi-method Advanced Analysis',
                'created_at': val.created_at.isoformat(),
                'low_range': valuation_data.get('range', {}).get('low', 0),
                'high_range': valuation_data.get('range', {}).get('high', 0),
                'years_analyzed': valuation_data.get('years_analyzed', 0)
            })
        
        # Sort by date (newest first)
        all_valuations.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            'success': True,
            'valuations': all_valuations
        }), 200
        
    except Exception as e:
        print(f"Error fetching history: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@valuation_bp.route('/<int:valuation_id>', methods=['GET'])
@jwt_required()
def get_valuation(valuation_id):
    """Get specific valuation with full details"""
    try:
        user_id = get_jwt_identity()
        
        valuation = Valuation.query.filter_by(
            id=valuation_id,
            user_id=int(user_id)
        ).first()
        
        if not valuation:
            return jsonify({'error': 'Valuation not found'}), 404
        
        result = valuation.to_dict()
        
        # Include full calculation details
        if valuation.calculation_details:
            result['calculation_details'] = json.loads(valuation.calculation_details)
        
        if valuation.input_data:
            result['input_data'] = json.loads(valuation.input_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@valuation_bp.route('/<int:valuation_id>', methods=['DELETE'])
@jwt_required()
def delete_valuation(valuation_id):
    """Archive a valuation"""
    try:
        user_id = get_jwt_identity()
        
        valuation = Valuation.query.filter_by(
            id=valuation_id,
            user_id=int(user_id)
        ).first()
        
        if not valuation:
            return jsonify({'error': 'Valuation not found'}), 404
        
        valuation.is_archived = True
        db.session.commit()
        
        return jsonify({'message': 'Valuation archived'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
