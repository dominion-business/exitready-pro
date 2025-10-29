"""
ExitReady Pro - Valuation Engine
Implements 5 valuation methods for business valuation
"""
import math
from typing import Dict, List, Tuple, Optional


class ValuationEngine:
    """
    Comprehensive business valuation engine
    Supports: CCA, DCF, Capitalization of Earnings, NAV, Rule of Thumb
    """
    
    # Default assumptions
    DEFAULT_DISCOUNT_RATE = 0.15  # 15% for private companies
    DEFAULT_TERMINAL_GROWTH = 0.03  # 3% perpetual growth
    DEFAULT_PROJECTION_YEARS = 5
    PRIVATE_COMPANY_DISCOUNT = 0.25  # 25% illiquidity discount
    
    def __init__(self):
        self.results = {}
    
    # ============================================================================
    # METHOD 1: CCA (Comparable Company Analysis)
    # ============================================================================
    
    def calculate_cca(self, 
                      revenue: float,
                      ebitda: float,
                      net_income: float,
                      industry_multiples: Dict,
                      apply_discount: bool = True) -> Dict:
        """
        Comparable Company Analysis using industry multiples
        
        Args:
            revenue: Annual revenue
            ebitda: EBITDA (Earnings Before Interest, Tax, Depreciation, Amortization)
            net_income: Net income/profit
            industry_multiples: Dict with 'ev_ebitda', 'ev_revenue', 'pe' ranges
            apply_discount: Apply 25% private company discount
        
        Returns:
            Dict with valuation ranges and details
        """
        results = {
            'method': 'CCA',
            'valuations': {},
            'recommended': None,
            'details': {}
        }
        
        discount = (1 - self.PRIVATE_COMPANY_DISCOUNT) if apply_discount else 1.0
        
        # EV/EBITDA valuation
        if ebitda > 0 and industry_multiples.get('ev_ebitda'):
            ev_ebitda = industry_multiples['ev_ebitda']
            results['valuations']['ev_ebitda'] = {
                'low': ebitda * ev_ebitda.get('low', 0) * discount,
                'median': ebitda * ev_ebitda.get('median', 0) * discount,
                'high': ebitda * ev_ebitda.get('high', 0) * discount,
                'multiple_used': ev_ebitda.get('median', 0)
            }
        
        # EV/Revenue valuation
        if revenue > 0 and industry_multiples.get('ev_revenue'):
            ev_revenue = industry_multiples['ev_revenue']
            results['valuations']['ev_revenue'] = {
                'low': revenue * ev_revenue.get('low', 0) * discount,
                'median': revenue * ev_revenue.get('median', 0) * discount,
                'high': revenue * ev_revenue.get('high', 0) * discount,
                'multiple_used': ev_revenue.get('median', 0)
            }
        
        # P/E valuation
        if net_income > 0 and industry_multiples.get('pe'):
            pe = industry_multiples['pe']
            results['valuations']['pe'] = {
                'low': net_income * pe.get('low', 0) * discount,
                'median': net_income * pe.get('median', 0) * discount,
                'high': net_income * pe.get('high', 0) * discount,
                'multiple_used': pe.get('median', 0)
            }
        
        # Determine recommended valuation (prefer EV/EBITDA if available)
        if 'ev_ebitda' in results['valuations']:
            results['recommended'] = results['valuations']['ev_ebitda']['median']
            results['low_range'] = results['valuations']['ev_ebitda']['low']
            results['high_range'] = results['valuations']['ev_ebitda']['high']
            results['primary_method'] = 'EV/EBITDA'
        elif 'ev_revenue' in results['valuations']:
            results['recommended'] = results['valuations']['ev_revenue']['median']
            results['low_range'] = results['valuations']['ev_revenue']['low']
            results['high_range'] = results['valuations']['ev_revenue']['high']
            results['primary_method'] = 'EV/Revenue'
        elif 'pe' in results['valuations']:
            results['recommended'] = results['valuations']['pe']['median']
            results['low_range'] = results['valuations']['pe']['low']
            results['high_range'] = results['valuations']['pe']['high']
            results['primary_method'] = 'P/E Ratio'
        
        results['details'] = {
            'discount_applied': apply_discount,
            'discount_rate': self.PRIVATE_COMPANY_DISCOUNT if apply_discount else 0,
            'reasoning': 'CCA uses market multiples from comparable public companies, adjusted for private company illiquidity.'
        }
        
        return results
    
    # ============================================================================
    # METHOD 2: DCF (Discounted Cash Flow)
    # ============================================================================
    
    def calculate_dcf(self,
                      current_cash_flow: float,
                      growth_rates: List[float] = None,
                      discount_rate: float = None,
                      terminal_growth: float = None,
                      projection_years: int = None) -> Dict:
        """
        Discounted Cash Flow valuation
        
        Args:
            current_cash_flow: Current year's free cash flow
            growth_rates: List of growth rates for each projection year (e.g., [0.15, 0.12, 0.10, 0.08, 0.05])
            discount_rate: Discount rate (WACC or required return)
            terminal_growth: Perpetual growth rate after projection period
            projection_years: Number of years to project
        
        Returns:
            Dict with NPV and detailed projections
        """
        # Set defaults
        discount_rate = discount_rate or self.DEFAULT_DISCOUNT_RATE
        terminal_growth = terminal_growth or self.DEFAULT_TERMINAL_GROWTH
        projection_years = projection_years or self.DEFAULT_PROJECTION_YEARS
        
        # Default declining growth rates if not provided
        if not growth_rates:
            growth_rates = [0.15, 0.12, 0.10, 0.08, 0.05][:projection_years]
        
        # Ensure we have enough growth rates
        while len(growth_rates) < projection_years:
            growth_rates.append(growth_rates[-1] * 0.8)  # Declining growth
        
        results = {
            'method': 'DCF',
            'projections': [],
            'terminal_value': 0,
            'enterprise_value': 0,
            'details': {}
        }
        
        # Project cash flows
        cash_flow = current_cash_flow
        pv_total = 0
        
        for year in range(1, projection_years + 1):
            growth = growth_rates[year - 1] if year <= len(growth_rates) else terminal_growth
            cash_flow = cash_flow * (1 + growth)
            
            # Discount to present value
            discount_factor = (1 + discount_rate) ** year
            pv = cash_flow / discount_factor
            pv_total += pv
            
            results['projections'].append({
                'year': year,
                'cash_flow': cash_flow,
                'growth_rate': growth,
                'discount_factor': discount_factor,
                'present_value': pv
            })
        
        # Terminal value (Gordon Growth Model)
        terminal_cash_flow = cash_flow * (1 + terminal_growth)
        terminal_value = terminal_cash_flow / (discount_rate - terminal_growth)
        terminal_pv = terminal_value / ((1 + discount_rate) ** projection_years)
        
        results['terminal_value'] = terminal_value
        results['terminal_pv'] = terminal_pv
        results['enterprise_value'] = pv_total + terminal_pv
        results['recommended'] = results['enterprise_value']
        
        # Add confidence range (±20%)
        results['low_range'] = results['enterprise_value'] * 0.8
        results['high_range'] = results['enterprise_value'] * 1.2
        
        results['details'] = {
            'discount_rate': discount_rate,
            'terminal_growth': terminal_growth,
            'projection_years': projection_years,
            'pv_of_projections': pv_total,
            'pv_of_terminal': terminal_pv,
            'reasoning': 'DCF values future cash flows discounted to present value using WACC.'
        }
        
        return results
    
    # ============================================================================
    # METHOD 3: Capitalization of Earnings
    # ============================================================================
    
    def calculate_capitalization_of_earnings(self,
                                             normalized_earnings: float,
                                             cap_rate: float = None,
                                             industry_multiples: Dict = None) -> Dict:
        """
        Capitalization of Earnings method
        Valuation = Normalized Earnings / Capitalization Rate
        
        Args:
            normalized_earnings: Adjusted/normalized annual earnings (EBITDA or Net Income)
            cap_rate: Capitalization rate (inverse of P/E multiple)
            industry_multiples: Optional industry multiples to derive cap rate
        
        Returns:
            Dict with valuation
        """
        results = {
            'method': 'Capitalization of Earnings',
            'valuations': {},
            'recommended': None,
            'details': {}
        }
        
        # Determine capitalization rate
        if cap_rate is None:
            # Derive from industry multiples or use default
            if industry_multiples and industry_multiples.get('pe'):
                pe = industry_multiples['pe']
                # Cap rate is inverse of P/E multiple
                cap_rate_low = 1 / pe.get('high', 10) if pe.get('high') else 0.10
                cap_rate_median = 1 / pe.get('median', 8) if pe.get('median') else 0.125
                cap_rate_high = 1 / pe.get('low', 6) if pe.get('low') else 0.167
            else:
                # Default cap rates for private companies
                cap_rate_low = 0.20  # 20% (5x multiple)
                cap_rate_median = 0.25  # 25% (4x multiple)
                cap_rate_high = 0.33  # 33% (3x multiple)
        else:
            cap_rate_low = cap_rate * 0.8
            cap_rate_median = cap_rate
            cap_rate_high = cap_rate * 1.2
        
        # Calculate valuations
        if normalized_earnings > 0:
            results['valuations'] = {
                'low': normalized_earnings / cap_rate_high,  # Lower cap rate = higher value
                'median': normalized_earnings / cap_rate_median,
                'high': normalized_earnings / cap_rate_low
            }
            
            results['recommended'] = results['valuations']['median']
            results['low_range'] = results['valuations']['low']
            results['high_range'] = results['valuations']['high']
        
        results['details'] = {
            'normalized_earnings': normalized_earnings,
            'cap_rate_used': cap_rate_median,
            'cap_rate_range': {
                'low': cap_rate_low,
                'median': cap_rate_median,
                'high': cap_rate_high
            },
            'reasoning': 'Capitalizes normalized earnings using industry-appropriate capitalization rate.'
        }
        
        return results
    
    # ============================================================================
    # METHOD 4: NAV (Net Asset Value)
    # ============================================================================
    
    def calculate_nav(self,
                      total_assets: float,
                      total_liabilities: float,
                      adjustments: Dict = None) -> Dict:
        """
        Net Asset Value (Book Value) method
        Especially useful for asset-heavy businesses
        
        Args:
            total_assets: Total assets at fair market value
            total_liabilities: Total liabilities
            adjustments: Dict with optional adjustments (e.g., {'intangibles': -50000, 'goodwill': 100000})
        
        Returns:
            Dict with NAV
        """
        results = {
            'method': 'NAV',
            'asset_value': total_assets,
            'liabilities': total_liabilities,
            'adjustments': adjustments or {},
            'nav': 0,
            'details': {}
        }
        
        # Calculate base NAV
        nav = total_assets - total_liabilities
        
        # Apply adjustments
        if adjustments:
            for adjustment_name, adjustment_value in adjustments.items():
                nav += adjustment_value
                results['details'][f'adjustment_{adjustment_name}'] = adjustment_value
        
        results['nav'] = nav
        results['recommended'] = nav
        
        # Add range based on asset valuation uncertainty (±15%)
        results['low_range'] = nav * 0.85
        results['high_range'] = nav * 1.15
        
        results['details']['reasoning'] = 'NAV calculates net worth based on fair market value of assets minus liabilities.'
        
        return results
    
    # ============================================================================
    # METHOD 5: Rule of Thumb
    # ============================================================================
    
    def calculate_rule_of_thumb(self,
                                revenue: float,
                                industry_rule: str,
                                multiplier: float = None) -> Dict:
        """
        Industry-specific Rule of Thumb valuations
        
        Args:
            revenue: Annual revenue
            industry_rule: Description of the rule (e.g., "2-3x revenue for SaaS")
            multiplier: Revenue multiplier (e.g., 2.5 for SaaS)
        
        Returns:
            Dict with valuation
        """
        results = {
            'method': 'Rule of Thumb',
            'industry_rule': industry_rule,
            'multiplier': multiplier,
            'recommended': None,
            'details': {}
        }
        
        if multiplier and revenue > 0:
            # Simple revenue multiple
            results['recommended'] = revenue * multiplier
            results['low_range'] = revenue * (multiplier * 0.8)
            results['high_range'] = revenue * (multiplier * 1.2)
            
            results['details'] = {
                'revenue': revenue,
                'multiplier': multiplier,
                'reasoning': f'Industry rule of thumb: {industry_rule}'
            }
        else:
            results['details']['error'] = 'No multiplier provided for this industry'
        
        return results
    
    # ============================================================================
    # COMPREHENSIVE VALUATION (All Methods)
    # ============================================================================
    
    def calculate_comprehensive(self,
                                revenue: float,
                                ebitda: float,
                                net_income: float,
                                cash_flow: float,
                                total_assets: float,
                                total_liabilities: float,
                                industry_multiples: Dict,
                                growth_rates: List[float] = None,
                                discount_rate: float = None) -> Dict:
        """
        Run all valuation methods and provide weighted average
        
        Returns:
            Dict with all method results and recommended valuation
        """
        results = {
            'methods': {},
            'summary': {},
            'recommended_valuation': None
        }
        
        # Method 1: CCA
        try:
            cca = self.calculate_cca(revenue, ebitda, net_income, industry_multiples)
            results['methods']['cca'] = cca
        except Exception as e:
            results['methods']['cca'] = {'error': str(e)}
        
        # Method 2: DCF
        try:
            dcf = self.calculate_dcf(cash_flow, growth_rates, discount_rate)
            results['methods']['dcf'] = dcf
        except Exception as e:
            results['methods']['dcf'] = {'error': str(e)}
        
        # Method 3: Capitalization of Earnings
        try:
            coe = self.calculate_capitalization_of_earnings(ebitda, industry_multiples=industry_multiples)
            results['methods']['capitalization'] = coe
        except Exception as e:
            results['methods']['capitalization'] = {'error': str(e)}
        
        # Method 4: NAV
        try:
            nav = self.calculate_nav(total_assets, total_liabilities)
            results['methods']['nav'] = nav
        except Exception as e:
            results['methods']['nav'] = {'error': str(e)}
        
        # Method 5: Rule of Thumb (if available)
        if industry_multiples.get('rule_of_thumb'):
            try:
                rot = self.calculate_rule_of_thumb(
                    revenue,
                    industry_multiples.get('rule_of_thumb', 'Not available'),
                    industry_multiples.get('rot_multiplier')
                )
                results['methods']['rule_of_thumb'] = rot
            except Exception as e:
                results['methods']['rule_of_thumb'] = {'error': str(e)}
        
        # Calculate weighted average (prefer CCA and DCF)
        valuations = []
        weights = []
        
        if 'cca' in results['methods'] and results['methods']['cca'].get('recommended'):
            valuations.append(results['methods']['cca']['recommended'])
            weights.append(0.35)  # 35% weight
        
        if 'dcf' in results['methods'] and results['methods']['dcf'].get('recommended'):
            valuations.append(results['methods']['dcf']['recommended'])
            weights.append(0.35)  # 35% weight
        
        if 'capitalization' in results['methods'] and results['methods']['capitalization'].get('recommended'):
            valuations.append(results['methods']['capitalization']['recommended'])
            weights.append(0.20)  # 20% weight
        
        if 'nav' in results['methods'] and results['methods']['nav'].get('recommended'):
            valuations.append(results['methods']['nav']['recommended'])
            weights.append(0.10)  # 10% weight
        
        # Weighted average
        if valuations:
            # Normalize weights
            total_weight = sum(weights)
            normalized_weights = [w / total_weight for w in weights]
            
            weighted_avg = sum(v * w for v, w in zip(valuations, normalized_weights))
            
            results['summary'] = {
                'weighted_average': weighted_avg,
                'simple_average': sum(valuations) / len(valuations),
                'min_valuation': min(valuations),
                'max_valuation': max(valuations),
                'valuation_range': f"${min(valuations):,.0f} - ${max(valuations):,.0f}",
                'methods_used': len(valuations)
            }
            
            results['recommended_valuation'] = weighted_avg
        
        return results
