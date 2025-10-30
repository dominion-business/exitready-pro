"""
PDF Generator for Assessment Reports
Generates professional PDF reports for gap analysis assessments
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from datetime import datetime
from io import BytesIO


class AssessmentPDFGenerator:
    """Generate PDF reports for assessments"""

    def __init__(self):
        self.buffer = BytesIO()
        self.pagesize = letter
        self.width, self.height = self.pagesize

    def _get_gap_zone_info(self, score):
        """Get gap zone information based on score"""
        if score > 86:
            return {
                'label': 'No Gaps',
                'color': HexColor('#c49e73'),
                'range': '>86%'
            }
        elif score > 72:
            return {
                'label': 'Minor Gaps',
                'color': HexColor('#a7d5a8'),
                'range': '72-86%'
            }
        elif score > 57:
            return {
                'label': 'Considerable Gaps',
                'color': HexColor('#b8d4e8'),
                'range': '57-72%'
            }
        elif score > 43:
            return {
                'label': 'Critical Gaps',
                'color': HexColor('#f4ebb0'),
                'range': '43-57%'
            }
        elif score > 28:
            return {
                'label': 'Very Critical Gaps',
                'color': HexColor('#f5d7b3'),
                'range': '28-43%'
            }
        else:
            return {
                'label': 'Extremely Critical',
                'color': HexColor('#f5c9c9'),
                'range': '0-28%'
            }

    def _get_category_display_name(self, category_key):
        """Map category keys to display names"""
        category_map = {
            'financial_performance': 'Financial Health',
            'revenue_quality': 'Revenue Quality',
            'customer_concentration': 'Customer Base',
            'management_team': 'Management Team',
            'competitive_position': 'Competitive Position',
            'growth_potential': 'Growth Trajectory',
            'intellectual_property': 'Intellectual Property',
            'legal_compliance': 'Legal & Compliance',
            'owner_dependency': 'Owner Dependency',
            'strategic_positioning': 'Strategic Position'
        }
        return category_map.get(category_key, category_key)

    def generate_report(self, assessment_data, user_info=None):
        """
        Generate PDF report for assessment

        Args:
            assessment_data: Dictionary containing assessment information
            user_info: Optional dictionary with user information

        Returns:
            BytesIO buffer containing the PDF
        """
        # Create document
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=self.pagesize,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=1*inch,
            bottomMargin=0.75*inch
        )

        # Container for elements
        elements = []

        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )

        subheading_style = ParagraphStyle(
            'CustomSubHeading',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=HexColor('#374151'),
            spaceAfter=8,
            fontName='Helvetica-Bold'
        )

        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=HexColor('#374151'),
            spaceAfter=6
        )

        # Title
        elements.append(Paragraph("Business Attractiveness Analysis Report", title_style))
        elements.append(Spacer(1, 0.1*inch))

        # Report metadata
        report_date = datetime.now().strftime('%B %d, %Y')
        assessment_date = assessment_data.get('created_at', '')
        if assessment_date:
            try:
                assessment_date = datetime.fromisoformat(assessment_date.replace('Z', '+00:00'))
                assessment_date = assessment_date.strftime('%B %d, %Y')
            except:
                assessment_date = 'N/A'

        metadata_data = [
            ['Report Generated:', report_date],
            ['Assessment Date:', assessment_date],
            ['Questions Answered:', f"{assessment_data.get('answered_questions', 0)}"]
        ]

        metadata_table = Table(metadata_data, colWidths=[2*inch, 3*inch])
        metadata_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), HexColor('#374151')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(metadata_table)
        elements.append(Spacer(1, 0.3*inch))

        # Overall Score Section
        elements.append(Paragraph("Overall Business Attractiveness Score", heading_style))

        overall_score = assessment_data.get('overall_score', 0)
        gap_info = self._get_gap_zone_info(overall_score)

        score_data = [
            ['Overall Score', f"{round(overall_score)}%"],
            ['Assessment', gap_info['label']],
            ['Score Range', gap_info['range']]
        ]

        score_table = Table(score_data, colWidths=[2.5*inch, 2.5*inch])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#e5e7eb')),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 1), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('TEXTCOLOR', (0, 0), (-1, -1), HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#d1d5db')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#f9fafb')])
        ]))
        elements.append(score_table)
        elements.append(Spacer(1, 0.3*inch))

        # Score interpretation
        elements.append(Paragraph("Score Interpretation", subheading_style))
        interpretation = self._get_score_interpretation(overall_score)
        elements.append(Paragraph(interpretation, normal_style))
        elements.append(Spacer(1, 0.3*inch))

        # Category Breakdown
        elements.append(Paragraph("Category Breakdown", heading_style))

        category_scores = assessment_data.get('category_scores', {})
        category_order = [
            'financial_performance',
            'revenue_quality',
            'customer_concentration',
            'management_team',
            'competitive_position',
            'growth_potential',
            'intellectual_property',
            'legal_compliance',
            'owner_dependency',
            'strategic_positioning'
        ]

        category_data = [['Category', 'Score', 'Assessment']]
        for cat_key in category_order:
            if cat_key in category_scores:
                score = category_scores[cat_key]
                gap_info = self._get_gap_zone_info(score)
                category_data.append([
                    self._get_category_display_name(cat_key),
                    f"{round(score)}%",
                    gap_info['label']
                ])

        category_table = Table(category_data, colWidths=[2.5*inch, 1.25*inch, 2*inch])
        category_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#d1d5db')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#f9fafb')])
        ]))
        elements.append(category_table)
        elements.append(Spacer(1, 0.3*inch))

        # Gap Distribution
        elements.append(Paragraph("Gap Distribution Summary", heading_style))

        responses = assessment_data.get('responses', [])
        gap_distribution = self._calculate_gap_distribution(responses)

        gap_data = [['Gap Level', 'Count', 'Percentage']]
        total_responses = len([r for r in responses if r.get('answer_value', 0) != 0])

        for gap_level in ['No Gaps', 'Minor Gaps', 'Considerable Gaps', 'Critical Gaps', 'Very Critical Gaps', 'Extremely Critical']:
            count = gap_distribution.get(gap_level, 0)
            percentage = (count / total_responses * 100) if total_responses > 0 else 0
            gap_data.append([gap_level, str(count), f"{round(percentage)}%"])

        gap_table = Table(gap_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
        gap_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#d1d5db')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#f9fafb')])
        ]))
        elements.append(gap_table)
        elements.append(Spacer(1, 0.3*inch))

        # Recommendations
        elements.append(PageBreak())
        elements.append(Paragraph("Recommendations for Improvement", heading_style))

        recommendations = self._generate_recommendations(category_scores)
        for rec in recommendations:
            elements.append(Paragraph(f"• {rec}", normal_style))

        elements.append(Spacer(1, 0.3*inch))

        # Next Steps
        elements.append(Paragraph("Next Steps", heading_style))
        next_steps = [
            "Review areas with the lowest scores and identify specific improvement opportunities",
            "Prioritize actions that will have the greatest impact on your overall attractiveness score",
            "Set measurable goals and timelines for implementing improvements",
            "Re-assess your business in 3-6 months to track progress",
            "Consider consulting with advisors for specific areas requiring expertise"
        ]
        for step in next_steps:
            elements.append(Paragraph(f"• {step}", normal_style))

        # Build PDF
        doc.build(elements)

        # Get PDF data
        self.buffer.seek(0)
        return self.buffer

    def _get_score_interpretation(self, score):
        """Get interpretation text based on overall score"""
        if score > 86:
            return "Excellent! Your business shows exceptional performance with minimal gaps. You are well-positioned for a successful exit."
        elif score > 72:
            return "Strong performance with only minor gaps. Focus on addressing the identified weaknesses to maximize your exit value."
        elif score > 57:
            return "Average to good performance with considerable room for improvement. Addressing key gaps will significantly enhance your business attractiveness."
        elif score > 43:
            return "Below average performance with critical gaps that need attention. Significant work is required to improve business attractiveness to buyers."
        elif score > 28:
            return "Poor performance with very critical gaps. Urgent attention is needed across multiple areas to improve exit readiness."
        else:
            return "Critical deficiencies exist that will significantly impact business value. Comprehensive improvements are essential before considering an exit."

    def _calculate_gap_distribution(self, responses):
        """Calculate distribution of responses across gap zones"""
        distribution = {
            'No Gaps': 0,
            'Minor Gaps': 0,
            'Considerable Gaps': 0,
            'Critical Gaps': 0,
            'Very Critical Gaps': 0,
            'Extremely Critical': 0
        }

        for response in responses:
            # Skip N/A responses
            if response.get('answer_value', 0) == 0:
                continue

            score = response.get('score', 0)
            gap_info = self._get_gap_zone_info(score)
            distribution[gap_info['label']] += 1

        return distribution

    def _generate_recommendations(self, category_scores):
        """Generate recommendations based on category scores"""
        recommendations = []

        # Sort categories by score (lowest first)
        sorted_categories = sorted(category_scores.items(), key=lambda x: x[1])

        # Take the 3 lowest scoring categories
        for cat_key, score in sorted_categories[:3]:
            category_name = self._get_category_display_name(cat_key)

            if score <= 43:
                recommendations.append(
                    f"<b>{category_name}</b> (Score: {round(score)}%): This area requires immediate attention. "
                    f"Focus on developing concrete action plans to address critical weaknesses."
                )
            elif score <= 57:
                recommendations.append(
                    f"<b>{category_name}</b> (Score: {round(score)}%): Considerable improvement needed. "
                    f"Identify specific gaps and create a roadmap for improvement."
                )
            elif score <= 72:
                recommendations.append(
                    f"<b>{category_name}</b> (Score: {round(score)}%): Minor improvements will help strengthen this area. "
                    f"Review individual questions to identify quick wins."
                )

        if not recommendations:
            recommendations.append(
                "Your business is performing well across all categories. Continue to maintain high standards "
                "and look for opportunities to achieve best-in-class performance in remaining areas."
            )

        return recommendations
