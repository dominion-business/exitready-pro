"""
PDF Generation Service for ExitReady Pro
Generates professional valuation reports with charts, disclosures, and methodology
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from datetime import datetime
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import os

class ValuationPDFGenerator:
    """Generate professional PDF reports for business valuations"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='SubTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        # Disclosure style
        self.styles.add(ParagraphStyle(
            name='Disclosure',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#6b7280'),
            alignment=TA_JUSTIFY,
            leading=12
        ))
        
        # Method description style
        self.styles.add(ParagraphStyle(
            name='MethodDesc',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            spaceAfter=8
        ))
        
    def _create_header_footer(self, canvas_obj, doc):
        """Add header and footer to each page"""
        canvas_obj.saveState()
        width, height = letter
        
        # Header
        canvas_obj.setFont('Helvetica-Bold', 10)
        canvas_obj.setFillColor(colors.HexColor('#1e40af'))
        canvas_obj.drawString(inch, height - 0.5*inch, "ExitReady Pro")
        canvas_obj.drawRightString(width - inch, height - 0.5*inch, 
                                   f"Generated: {datetime.now().strftime('%B %d, %Y')}")
        
        # Header line
        canvas_obj.setStrokeColor(colors.HexColor('#3b82f6'))
        canvas_obj.setLineWidth(2)
        canvas_obj.line(inch, height - 0.6*inch, width - inch, height - 0.6*inch)
        
        # Footer
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.setFillColor(colors.HexColor('#6b7280'))
        canvas_obj.drawCentredString(width/2.0, 0.5*inch, 
                                     f"Page {doc.page} | Confidential Business Valuation Report")
        
        canvas_obj.restoreState()
        
    def _create_chart(self, data_dict, chart_type='bar'):
        """Create matplotlib chart and return as image buffer"""
        fig, ax = plt.subplots(figsize=(8, 5))
        
        if chart_type == 'bar':
            methods = list(data_dict.keys())
            values = list(data_dict.values())
            
            colors_list = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
            bars = ax.bar(methods, values, color=colors_list[:len(methods)])
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'${height:,.0f}',
                       ha='center', va='bottom', fontsize=10, fontweight='bold')
            
            ax.set_ylabel('Business Value ($)', fontsize=12, fontweight='bold')
            ax.set_xlabel('Valuation Method', fontsize=12, fontweight='bold')
            ax.set_title('Valuation Methods Comparison', fontsize=14, fontweight='bold', pad=20)
            
            # Rotate x-axis labels for better readability
            plt.xticks(rotation=15, ha='right')
            
        elif chart_type == 'pie':
            methods = list(data_dict.keys())
            values = list(data_dict.values())
            colors_list = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
            
            ax.pie(values, labels=methods, autopct='%1.1f%%', startangle=90,
                  colors=colors_list[:len(methods)])
            ax.set_title('Valuation Distribution', fontsize=14, fontweight='bold', pad=20)
        
        # Style improvements
        ax.grid(axis='y', alpha=0.3, linestyle='--')
        plt.tight_layout()
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        plt.close()
        
        return buf
        
    def generate_advanced_report(self, valuation_data, business_profile, filename):
        """Generate comprehensive PDF report for advanced valuation"""
        
        doc = SimpleDocTemplate(filename, pagesize=letter,
                               topMargin=1*inch, bottomMargin=0.75*inch,
                               leftMargin=0.75*inch, rightMargin=0.75*inch)
        
        story = []
        
        # ===== COVER PAGE =====
        story.append(Spacer(1, 2*inch))
        
        story.append(Paragraph("Business Valuation Report", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.3*inch))
        
        story.append(Paragraph(f"<b>{business_profile.get('business_name', 'Your Business')}</b>", 
                              self.styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph(f"Industry: {business_profile.get('industry', 'Not Specified')}", 
                              self.styles['Normal']))
        story.append(Spacer(1, 0.5*inch))
        
        # Valuation Summary Box
        summary_data = [
            ['Valuation Summary', ''],
            ['Weighted Average Value', f"${valuation_data.get('weighted_average', 0):,.0f}"],
            ['Valuation Date', datetime.now().strftime('%B %d, %Y')],
            ['Report Type', 'Advanced Multi-Method Analysis']
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(summary_table)
        story.append(PageBreak())
        
        # ===== DISCLOSURE & DISCLAIMER =====
        story.append(Paragraph("Important Disclosure", self.styles['SubTitle']))
        
        disclosure_text = """
        <b>PROFESSIONAL DISCLOSURE:</b> This valuation report has been prepared using automated valuation 
        methodologies based on industry-standard practices and publicly available data. This report is intended 
        for informational and planning purposes only and should not be relied upon as the sole basis for any 
        transaction or financial decision.
        <br/><br/>
        <b>LIMITATIONS:</b> The valuations presented herein are estimates based on the information provided 
        and standard valuation multiples. Actual transaction values may vary significantly based on market 
        conditions, buyer motivations, deal structure, and numerous other factors not captured in these models.
        <br/><br/>
        <b>PROFESSIONAL ADVICE RECOMMENDED:</b> We strongly recommend engaging qualified professionals including:
        <br/>• Certified Exit Planning Advisors (CEPA)
        <br/>• Business Valuation Specialists (CVA, ASA, ABV)
        <br/>• M&A Advisors and Investment Bankers
        <br/>• Tax and Legal Counsel
        <br/><br/>
        <b>NOT A FORMAL APPRAISAL:</b> This report does not constitute a formal business appraisal as defined 
        by professional valuation standards (e.g., USPAP, IBA). For regulatory, litigation, or tax purposes, 
        a formal appraisal by a credentialed valuator is required.
        <br/><br/>
        <b>CONFIDENTIALITY:</b> This report contains confidential business information and should be handled 
        accordingly. Unauthorized distribution or use is prohibited.
        """
        
        story.append(Paragraph(disclosure_text, self.styles['Disclosure']))
        story.append(Spacer(1, 0.3*inch))
        story.append(PageBreak())
        
        # ===== BUSINESS PROFILE =====
        story.append(Paragraph("Business Profile", self.styles['SubTitle']))
        
        profile_data = [
            ['Business Name', business_profile.get('business_name', 'N/A')],
            ['Industry', business_profile.get('industry', 'N/A')],
            ['Annual Revenue', f"${business_profile.get('revenue', 0):,.0f}"],
            ['EBITDA', f"${business_profile.get('ebitda', 0):,.0f}"],
            ['Number of Employees', str(business_profile.get('employees', 'N/A'))],
            ['Years in Operation', str(business_profile.get('years_operating', 'N/A'))],
        ]
        
        profile_table = Table(profile_data, colWidths=[2.5*inch, 4*inch])
        profile_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(profile_table)
        story.append(Spacer(1, 0.3*inch))
        story.append(PageBreak())
        
        # ===== VALUATION RESULTS =====
        story.append(Paragraph("Valuation Results", self.styles['SubTitle']))
        
        # Create results table
        results_data = [
            ['Valuation Method', 'Calculated Value', 'Weight', 'Weighted Value']
        ]
        
        methods = valuation_data.get('methods', {})
        weights = valuation_data.get('weights', {})
        
        for method_key, method_info in methods.items():
            method_name = method_key.replace('_', ' ').title()
            value = method_info.get('value', 0)
            weight = weights.get(method_key, 0) * 100
            weighted_value = value * weights.get(method_key, 0)
            
            results_data.append([
                method_name,
                f"${value:,.0f}",
                f"{weight:.1f}%",
                f"${weighted_value:,.0f}"
            ])
        
        # Add totals row
        results_data.append([
            'WEIGHTED AVERAGE',
            '',
            '100%',
            f"${valuation_data.get('weighted_average', 0):,.0f}"
        ])
        
        results_table = Table(results_data, colWidths=[2.2*inch, 1.8*inch, 1*inch, 1.8*inch])
        results_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fef3c7')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(results_table)
        story.append(Spacer(1, 0.4*inch))
        
        # Add chart
        chart_data = {method_key.replace('_', ' ').title(): method_info.get('value', 0) 
                      for method_key, method_info in methods.items()}
        
        chart_buffer = self._create_chart(chart_data, chart_type='bar')
        chart_image = Image(chart_buffer, width=6*inch, height=3.75*inch)
        story.append(chart_image)
        story.append(PageBreak())
        
        # ===== METHODOLOGY SECTION =====
        story.append(Paragraph("Valuation Methodologies", self.styles['SubTitle']))
        
        methodologies = {
            'SDE Multiple': """
            <b>Seller's Discretionary Earnings (SDE) Multiple Method:</b> Commonly used for small businesses 
            (typically under $5M revenue). SDE represents the total financial benefit to one full-time owner-operator, 
            including salary, perks, and non-essential expenses. Industry multiples typically range from 2.0x to 5.0x 
            SDE, adjusted for growth, size, and risk factors.
            <br/><br/>
            <i>Best for:</i> Owner-operated businesses, service companies, franchises
            <br/><i>Typical Range:</i> 2.0x - 4.0x SDE
            """,
            
            'EBITDA Multiple': """
            <b>EBITDA Multiple Method:</b> The gold standard for mid-market businesses ($5M+ revenue). EBITDA 
            (Earnings Before Interest, Taxes, Depreciation, and Amortization) provides a clean measure of 
            operational profitability. Public company multiples are adjusted downward by 25-40% for private 
            companies due to liquidity constraints and information asymmetry.
            <br/><br/>
            <i>Best for:</i> Larger businesses with professional management
            <br/><i>Typical Range:</i> 3.0x - 10.0x EBITDA (industry dependent)
            """,
            
            'Revenue Multiple': """
            <b>Revenue Multiple Method:</b> Used when earnings are volatile or for early-stage/high-growth companies. 
            Different industries have established revenue multiple benchmarks based on historical transaction data. 
            Particularly relevant for SaaS, subscription businesses, and asset-light service companies.
            <br/><br/>
            <i>Best for:</i> Subscription businesses, SaaS, professional services
            <br/><i>Typical Range:</i> 0.5x - 3.0x Revenue
            """,
            
            'Asset-Based': """
            <b>Asset-Based (Net Asset Value) Method:</b> Calculates value as the fair market value of all assets 
            minus liabilities. Appropriate for asset-intensive businesses or as a floor value. Adjustments include 
            updating book values to market values, removing non-operating assets, and accounting for intangible assets.
            <br/><br/>
            <i>Best for:</i> Real estate companies, equipment-heavy businesses, liquidation scenarios
            <br/><i>Typical Range:</i> Book value to 1.5x book value
            """,
            
            'DCF (Discounted Cash Flow)': """
            <b>Discounted Cash Flow Method:</b> Projects future cash flows and discounts them to present value using 
            a risk-adjusted discount rate (typically 15-25% for private companies). Includes a terminal value 
            calculation for perpetual growth beyond the projection period. Most theoretically sound but relies heavily 
            on assumptions.
            <br/><br/>
            <i>Best for:</i> Stable, predictable businesses with solid financial history
            <br/><i>Key Assumptions:</i> 5-year projection, 15-20% discount rate, 3% terminal growth
            """
        }
        
        for method_name, description in methodologies.items():
            if any(method_name.lower().replace(' ', '_') in key.lower() for key in methods.keys()):
                story.append(Paragraph(method_name, self.styles['Heading3']))
                story.append(Paragraph(description, self.styles['MethodDesc']))
                story.append(Spacer(1, 0.2*inch))
        
        story.append(PageBreak())
        
        # ===== KEY FINANCIAL RATIOS & BENCHMARKS =====
        story.append(Paragraph("Key Financial Ratios & Industry Benchmarks", self.styles['SubTitle']))
        
        # Calculate ratios
        revenue = business_profile.get('revenue', 0)
        ebitda = business_profile.get('ebitda', 0)
        
        if revenue > 0:
            ebitda_margin = (ebitda / revenue) * 100
        else:
            ebitda_margin = 0
            
        ratios_text = f"""
        <b>Your Business Metrics:</b>
        <br/>• EBITDA Margin: {ebitda_margin:.1f}%
        <br/>• Valuation/Revenue Ratio: {(valuation_data.get('weighted_average', 0) / revenue if revenue > 0 else 0):.2f}x
        <br/>• Valuation/EBITDA Ratio: {(valuation_data.get('weighted_average', 0) / ebitda if ebitda > 0 else 0):.2f}x
        <br/><br/>
        <b>Industry Benchmark Ranges:</b>
        <br/>• EBITDA Margin: 10-25% (varies by industry)
        <br/>• Revenue Growth: 5-20% annually for attractive valuations
        <br/>• Owner Dependency: <30% revenue from owner relationships (optimal)
        <br/>• Customer Concentration: No single customer >15% of revenue (optimal)
        <br/>• Recurring Revenue: >60% for premium multiples (service businesses)
        <br/><br/>
        <b>Value Enhancement Opportunities:</b>
        <br/>• Improve EBITDA margins through operational efficiency
        <br/>• Diversify customer base to reduce concentration risk
        <br/>• Document systems and processes to reduce owner dependency
        <br/>• Build recurring revenue streams
        <br/>• Strengthen management team depth
        <br/>• Clean up financial statements and ensure GAAP compliance
        """
        
        story.append(Paragraph(ratios_text, self.styles['MethodDesc']))
        story.append(Spacer(1, 0.3*inch))
        story.append(PageBreak())
        
        # ===== NEXT STEPS =====
        story.append(Paragraph("Recommended Next Steps", self.styles['SubTitle']))
        
        next_steps_text = """
        <b>1. Validate and Refine Assumptions</b>
        <br/>Review the financial inputs and assumptions used in this valuation. Ensure they accurately reflect 
        your business performance and growth trajectory.
        <br/><br/>
        <b>2. Engage Professional Advisors</b>
        <br/>• Schedule a consultation with a Certified Exit Planning Advisor (CEPA)
        <br/>• Consider a formal valuation from a business appraiser (CVA, ASA, ABV)
        <br/>• Connect with M&A advisors if actively pursuing a sale
        <br/><br/>
        <b>3. Identify Value Gaps</b>
        <br/>Compare your business against the industry benchmarks above. Focus on areas where your business 
        underperforms industry standards - these represent opportunities for value enhancement.
        <br/><br/>
        <b>4. Develop an Action Plan</b>
        <br/>Create a 12-24 month plan to address key value drivers. Small improvements in EBITDA margins or 
        customer diversification can significantly impact valuation.
        <br/><br/>
        <b>5. Regular Monitoring</b>
        <br/>Re-run valuations quarterly to track progress and adjust strategies. Business value is dynamic 
        and changes with performance, market conditions, and strategic initiatives.
        <br/><br/>
        <b>6. Prepare Documentation</b>
        <br/>Begin organizing financial statements, contracts, customer lists, and operational documentation. 
        Well-documented businesses command premium valuations.
        """
        
        story.append(Paragraph(next_steps_text, self.styles['MethodDesc']))
        
        # Build PDF with custom header/footer
        doc.build(story, onFirstPage=self._create_header_footer, 
                 onLaterPages=self._create_header_footer)
        
        return filename
    
    def generate_basic_report(self, valuation_data, business_profile, filename):
        """Generate simplified PDF report for basic valuation"""
        
        doc = SimpleDocTemplate(filename, pagesize=letter,
                               topMargin=1*inch, bottomMargin=0.75*inch,
                               leftMargin=0.75*inch, rightMargin=0.75*inch)
        
        story = []
        
        # ===== COVER PAGE =====
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Quick Business Valuation", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.3*inch))
        
        story.append(Paragraph(f"<b>{business_profile.get('business_name', 'Your Business')}</b>", 
                              self.styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph(f"Industry: {business_profile.get('industry', 'Not Specified')}", 
                              self.styles['Normal']))
        story.append(Spacer(1, 0.5*inch))
        
        # Simple valuation result
        estimated_value = valuation_data.get('estimated_value', 0)
        value_range_low = valuation_data.get('value_range_low', estimated_value * 0.8)
        value_range_high = valuation_data.get('value_range_high', estimated_value * 1.2)
        
        result_data = [
            ['Valuation Summary', ''],
            ['Estimated Value', f"${estimated_value:,.0f}"],
            ['Value Range', f"${value_range_low:,.0f} - ${value_range_high:,.0f}"],
            ['Valuation Date', datetime.now().strftime('%B %d, %Y')]
        ]
        
        result_table = Table(result_data, colWidths=[2.5*inch, 3*inch])
        result_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(result_table)
        story.append(PageBreak())
        
        # ===== DISCLOSURE (Shorter version) =====
        story.append(Paragraph("Important Notice", self.styles['SubTitle']))
        
        disclosure_text = """
        <b>INFORMATIONAL PURPOSES ONLY:</b> This quick valuation is a preliminary estimate based on limited 
        information and standard industry multiples. It should not be used as the sole basis for any transaction 
        or financial decision.
        <br/><br/>
        <b>PROFESSIONAL ADVICE RECOMMENDED:</b> For accurate valuations, please consult qualified professionals 
        including Certified Exit Planning Advisors (CEPA), Business Valuation Specialists, or M&A Advisors.
        <br/><br/>
        <b>NOT A FORMAL APPRAISAL:</b> This does not constitute a formal business appraisal. Formal appraisals 
        by credentialed valuators are required for regulatory, litigation, or tax purposes.
        """
        
        story.append(Paragraph(disclosure_text, self.styles['Disclosure']))
        story.append(Spacer(1, 0.3*inch))
        story.append(PageBreak())
        
        # ===== BUSINESS INFO & CALCULATION =====
        story.append(Paragraph("Your Business Information", self.styles['SubTitle']))
        
        profile_data = [
            ['Business Name', business_profile.get('business_name', 'N/A')],
            ['Industry', business_profile.get('industry', 'N/A')],
            ['Annual Revenue', f"${business_profile.get('revenue', 0):,.0f}"],
            ['EBITDA/Profit', f"${business_profile.get('ebitda', 0):,.0f}"]
        ]
        
        profile_table = Table(profile_data, colWidths=[2*inch, 4.5*inch])
        profile_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(profile_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Calculation explanation
        calc_text = f"""
        <b>Calculation Method:</b> This valuation uses the {valuation_data.get('method_used', 'Multiple Method')}, 
        which is commonly used for businesses in your industry. The calculation is based on your reported 
        financial metrics and standard industry multiples.
        <br/><br/>
        <b>Industry Multiple Applied:</b> {valuation_data.get('multiple_used', 'N/A')}x
        """
        
        story.append(Paragraph(calc_text, self.styles['MethodDesc']))
        story.append(Spacer(1, 0.4*inch))
        
        # Simple bar chart
        chart_data = {
            'Low Range': value_range_low,
            'Estimated Value': estimated_value,
            'High Range': value_range_high
        }
        
        chart_buffer = self._create_chart(chart_data, chart_type='bar')
        chart_image = Image(chart_buffer, width=6*inch, height=3.75*inch)
        story.append(chart_image)
        story.append(PageBreak())
        
        # ===== NEXT STEPS (Simplified) =====
        story.append(Paragraph("Next Steps", self.styles['SubTitle']))
        
        next_steps = """
        <b>1. Verify Your Numbers</b>
        <br/>Ensure the financial information you provided is accurate and represents your typical business performance.
        <br/><br/>
        <b>2. Get a Comprehensive Assessment</b>
        <br/>Upgrade to our Advanced Valuation for a detailed multi-method analysis with deeper insights.
        <br/><br/>
        <b>3. Consult an Expert</b>
        <br/>Connect with a Certified Exit Planning Advisor (CEPA) through our advisor marketplace for personalized guidance.
        <br/><br/>
        <b>4. Focus on Value Drivers</b>
        <br/>Work on improving profitability, reducing owner dependency, and diversifying your customer base to increase value.
        """
        
        story.append(Paragraph(next_steps, self.styles['MethodDesc']))
        
        # Build PDF
        doc.build(story, onFirstPage=self._create_header_footer, 
                 onLaterPages=self._create_header_footer)
        
        return filename
