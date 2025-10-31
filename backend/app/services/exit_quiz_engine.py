"""
Exit Strategy Quiz Engine
Contains quiz questions and scoring algorithm
"""

# Quiz questions - 20 strategic questions to determine best exit options
QUIZ_QUESTIONS = [
    {
        'id': 'Q1',
        'question': 'What is your primary goal for exiting your business?',
        'type': 'single',
        'options': [
            {'value': 'max_price', 'label': 'Maximize sale price'},
            {'value': 'preserve_legacy', 'label': 'Preserve company legacy and culture'},
            {'value': 'support_team', 'label': 'Support and reward my team'},
            {'value': 'quick_liquidity', 'label': 'Quick liquidity/cash out'},
            {'value': 'gradual_transition', 'label': 'Gradual transition while staying involved'}
        ]
    },
    {
        'id': 'Q2',
        'question': 'What is your ideal timeline for exiting?',
        'type': 'single',
        'options': [
            {'value': 'immediate', 'label': 'As soon as possible (0-6 months)'},
            {'value': 'near_term', 'label': 'Near term (6-18 months)'},
            {'value': 'medium_term', 'label': 'Medium term (1-3 years)'},
            {'value': 'long_term', 'label': 'Long term (3-5+ years)'},
            {'value': 'flexible', 'label': 'Flexible, depends on the opportunity'}
        ]
    },
    {
        'id': 'Q3',
        'question': 'How important is staying involved post-transaction?',
        'type': 'single',
        'options': [
            {'value': 'not_important', 'label': 'Not important - I want a clean break'},
            {'value': 'short_transition', 'label': 'Short transition period (3-12 months)'},
            {'value': 'moderate', 'label': 'Moderate involvement (1-3 years)'},
            {'value': 'very_important', 'label': 'Very important - I want to stay actively involved'},
            {'value': 'advisory', 'label': 'Advisory/board role only'}
        ]
    },
    {
        'id': 'Q4',
        'question': 'What is your annual revenue range?',
        'type': 'single',
        'options': [
            {'value': 'under_1m', 'label': 'Under $1M'},
            {'value': '1m_5m', 'label': '$1M - $5M'},
            {'value': '5m_20m', 'label': '$5M - $20M'},
            {'value': '20m_50m', 'label': '$20M - $50M'},
            {'value': 'over_50m', 'label': 'Over $50M'}
        ]
    },
    {
        'id': 'Q5',
        'question': 'What is your EBITDA margin?',
        'type': 'single',
        'options': [
            {'value': 'negative', 'label': 'Negative or break-even'},
            {'value': 'low', 'label': 'Low (0-10%)'},
            {'value': 'moderate', 'label': 'Moderate (10-20%)'},
            {'value': 'strong', 'label': 'Strong (20-30%)'},
            {'value': 'very_strong', 'label': 'Very strong (30%+)'}
        ]
    },
    {
        'id': 'Q6',
        'question': 'Do you have a capable management team that can run the business without you?',
        'type': 'single',
        'options': [
            {'value': 'highly_capable', 'label': 'Yes, highly capable and ready'},
            {'value': 'mostly_capable', 'label': 'Mostly, with some training/support'},
            {'value': 'developing', 'label': 'Team is developing but not ready yet'},
            {'value': 'limited', 'label': 'Limited - I am heavily involved in operations'},
            {'value': 'none', 'label': 'No management team beyond me'}
        ]
    },
    {
        'id': 'Q7',
        'question': 'Is there a family member or internal successor interested in taking over?',
        'type': 'single',
        'options': [
            {'value': 'yes_ready', 'label': 'Yes, and they are ready now'},
            {'value': 'yes_training', 'label': 'Yes, but they need more training/experience'},
            {'value': 'maybe', 'label': 'Maybe, still exploring this option'},
            {'value': 'no', 'label': 'No clear internal successor'},
            {'value': 'not_interested', 'label': 'Family/team not interested in taking over'}
        ]
    },
    {
        'id': 'Q8',
        'question': 'How important is preserving your company culture and employee jobs?',
        'type': 'single',
        'options': [
            {'value': 'critical', 'label': 'Critical - top priority'},
            {'value': 'very_important', 'label': 'Very important'},
            {'value': 'somewhat_important', 'label': 'Somewhat important'},
            {'value': 'not_priority', 'label': 'Not a priority'},
            {'value': 'indifferent', 'label': 'Indifferent - focused on financial outcome'}
        ]
    },
    {
        'id': 'Q9',
        'question': 'What is your customer concentration like?',
        'type': 'single',
        'options': [
            {'value': 'highly_diversified', 'label': 'Highly diversified (no customer >5%)'},
            {'value': 'diversified', 'label': 'Diversified (largest customer 5-10%)'},
            {'value': 'moderate', 'label': 'Moderate (largest customer 10-25%)'},
            {'value': 'concentrated', 'label': 'Concentrated (largest customer 25-50%)'},
            {'value': 'highly_concentrated', 'label': 'Highly concentrated (largest customer >50%)'}
        ]
    },
    {
        'id': 'Q10',
        'question': 'Does your business have strong recurring revenue or long-term contracts?',
        'type': 'single',
        'options': [
            {'value': 'high_recurring', 'label': 'Yes, 80%+ recurring/contracted revenue'},
            {'value': 'moderate_recurring', 'label': 'Moderate, 50-80% recurring'},
            {'value': 'some_recurring', 'label': 'Some recurring, 25-50%'},
            {'value': 'low_recurring', 'label': 'Low recurring, <25%'},
            {'value': 'project_based', 'label': 'Mostly project-based/one-time sales'}
        ]
    },
    {
        'id': 'Q11',
        'question': 'How much cash flow could the business support for debt service?',
        'type': 'single',
        'options': [
            {'value': 'strong', 'label': 'Strong - could service significant debt (2-3x EBITDA+)'},
            {'value': 'moderate', 'label': 'Moderate - some debt capacity (1-2x EBITDA)'},
            {'value': 'limited', 'label': 'Limited - minimal debt capacity'},
            {'value': 'none', 'label': 'None - cash flow too variable'},
            {'value': 'uncertain', 'label': 'Uncertain - need to analyze'}
        ]
    },
    {
        'id': 'Q12',
        'question': 'Would you be willing to accept seller financing or an earn-out?',
        'type': 'single',
        'options': [
            {'value': 'no_cash_only', 'label': 'No - I need all cash at closing'},
            {'value': 'small_portion', 'label': 'Maybe a small portion (10-20%)'},
            {'value': 'moderate', 'label': 'Yes, moderate amount (20-40%)'},
            {'value': 'substantial', 'label': 'Yes, substantial (40-60%)'},
            {'value': 'flexible', 'label': 'Very flexible - helps get the deal done'}
        ]
    },
    {
        'id': 'Q13',
        'question': 'Does your business have unique IP, technology, or strategic assets?',
        'type': 'single',
        'options': [
            {'value': 'strong_ip', 'label': 'Yes, strong patents/IP portfolio'},
            {'value': 'proprietary', 'label': 'Yes, proprietary technology/processes'},
            {'value': 'strategic_assets', 'label': 'Yes, valuable customer relationships or strategic position'},
            {'value': 'some', 'label': 'Some differentiation but not strongly protected'},
            {'value': 'commodity', 'label': 'No, relatively commodity business'}
        ]
    },
    {
        'id': 'Q14',
        'question': 'How scalable is your business model?',
        'type': 'single',
        'options': [
            {'value': 'highly_scalable', 'label': 'Highly scalable - can grow rapidly with capital'},
            {'value': 'moderately_scalable', 'label': 'Moderately scalable with some investment'},
            {'value': 'steady_growth', 'label': 'Steady growth potential, not rapid scale'},
            {'value': 'mature', 'label': 'Mature/stable - limited growth potential'},
            {'value': 'declining', 'label': 'Declining market or business'}
        ]
    },
    {
        'id': 'Q15',
        'question': 'Are there strategic buyers (competitors, suppliers, customers) who might want your business?',
        'type': 'single',
        'options': [
            {'value': 'multiple_strategic', 'label': 'Yes, multiple obvious strategic buyers'},
            {'value': 'some_strategic', 'label': 'Yes, a few potential strategic buyers'},
            {'value': 'maybe', 'label': 'Maybe, would need to explore'},
            {'value': 'unlikely', 'label': 'Unlikely - niche business'},
            {'value': 'dont_know', 'label': "Don't know"}
        ]
    },
    {
        'id': 'Q16',
        'question': 'What level of due diligence scrutiny are you comfortable with?',
        'type': 'single',
        'options': [
            {'value': 'full_scrutiny', 'label': 'Full scrutiny - books are clean and ready'},
            {'value': 'standard', 'label': 'Standard diligence - generally ready'},
            {'value': 'light_preferred', 'label': 'Prefer lighter diligence process'},
            {'value': 'concerns', 'label': 'Have concerns - some cleanup needed'},
            {'value': 'significant_concerns', 'label': 'Significant concerns - major cleanup needed'}
        ]
    },
    {
        'id': 'Q17',
        'question': 'Are you open to taking on a financial/growth partner versus selling outright?',
        'type': 'single',
        'options': [
            {'value': 'prefer_partner', 'label': 'Yes, prefer this - want to grow and exit later'},
            {'value': 'open', 'label': 'Open to it if terms are right'},
            {'value': 'prefer_full_sale', 'label': 'Prefer full sale but would consider'},
            {'value': 'full_sale_only', 'label': 'No, want full exit only'},
            {'value': 'uncertain', 'label': 'Uncertain - need to learn more'}
        ]
    },
    {
        'id': 'Q18',
        'question': 'How important are tax considerations in your exit strategy?',
        'type': 'single',
        'options': [
            {'value': 'critical', 'label': 'Critical - want to maximize after-tax proceeds'},
            {'value': 'very_important', 'label': 'Very important factor'},
            {'value': 'important', 'label': 'Important but not primary driver'},
            {'value': 'minor', 'label': 'Minor consideration'},
            {'value': 'not_concerned', 'label': 'Not concerned - focused on gross proceeds'}
        ]
    },
    {
        'id': 'Q19',
        'question': 'What is your tolerance for continued financial risk post-transaction?',
        'type': 'single',
        'options': [
            {'value': 'no_tolerance', 'label': 'None - want to de-risk completely'},
            {'value': 'minimal', 'label': 'Minimal - small earn-out ok'},
            {'value': 'moderate', 'label': 'Moderate - willing to keep some upside exposure'},
            {'value': 'high', 'label': 'High - comfortable with significant upside bet'},
            {'value': 'entrepreneur', 'label': 'Very high - entrepreneur mindset'}
        ]
    },
    {
        'id': 'Q20',
        'question': 'Do you have a strong relationship with your employees and want them to benefit from the exit?',
        'type': 'single',
        'options': [
            {'value': 'critical_priority', 'label': 'Yes, critical priority - want them to share in success'},
            {'value': 'very_important', 'label': 'Very important - would like to include them'},
            {'value': 'somewhat_important', 'label': 'Somewhat important'},
            {'value': 'not_priority', 'label': 'Not a priority - focused on my exit'},
            {'value': 'no_employees', 'label': 'Solo or very small team'}
        ]
    }
]


# Exit strategy definitions with scoring weights
EXIT_STRATEGIES = {
    'strategic_sale': {
        'name': 'Strategic Sale (Competitor/Supplier/Customer)',
        'category': 'External - Full Exit',
        'description': 'Highest potential price due to synergies; heavier diligence, possible culture changes.',
        'best_for': 'Maximizing valuation through strategic value and synergies'
    },
    'pe_full_sale': {
        'name': 'Financial Buyer (Private Equity) – Full Sale',
        'category': 'External - Full Exit',
        'description': 'Strong pricing and speed; may want current leadership to stay through transition.',
        'best_for': 'Quick liquidity with strong cash flow businesses'
    },
    'pe_recap': {
        'name': 'Recapitalization with PE (Second Bite)',
        'category': 'External - Partial Exit',
        'description': 'Take chips off the table now, stay to grow for a later, often larger, payout.',
        'best_for': 'De-risking while keeping significant upside potential'
    },
    'ipo_spac': {
        'name': 'Initial Public Offering (IPO) / SPAC',
        'category': 'External - Partial Exit',
        'description': 'Access to public capital and liquidity; costly, demanding, and only fits sizable, scalable firms.',
        'best_for': 'Large, scalable businesses with strong growth trajectory'
    },
    'merger_equals': {
        'name': 'Merger-of-Equals',
        'category': 'External - Strategic',
        'description': 'Combine to unlock scale; governance and integration complexity can be high.',
        'best_for': 'Creating scale in fragmented industries'
    },
    'mbo': {
        'name': 'Management Buyout (MBO)',
        'category': 'Internal - Full Succession',
        'description': 'Keeps continuity; financed via bank/SBA, mezzanine, or seller notes/earn-outs.',
        'best_for': 'Strong management team ready to take ownership'
    },
    'esop': {
        'name': 'Employee Stock Ownership Plan (ESOP)',
        'category': 'Internal - Full Succession',
        'description': 'Tax-advantaged exit, preserves culture; works best with stable cash flow and payroll.',
        'best_for': 'Preserving culture with tax-advantaged liquidity'
    },
    'family_succession': {
        'name': 'Family Succession',
        'category': 'Internal - Full Succession',
        'description': 'Preserve legacy and control tax outcomes; often uses trusts/entities, notes, or private annuities.',
        'best_for': 'Keeping business in the family with tax-efficient transfer'
    },
    'employee_coop': {
        'name': 'Employee Ownership / Co-op',
        'category': 'Internal - Full Succession',
        'description': 'Mission/culture aligned alternative to ESOP with simpler governance in some cases.',
        'best_for': 'Mission-driven businesses focused on employee ownership'
    },
    'minority_sale': {
        'name': 'Minority Equity Sale (Growth Investor)',
        'category': 'Partial - Liquidity',
        'description': 'Fund growth or de-risk; protect governance with strong shareholder terms.',
        'best_for': 'Raising growth capital while maintaining control'
    },
    'dividend_recap': {
        'name': 'Dividend Recapitalization',
        'category': 'Partial - Liquidity',
        'description': 'Borrow against the company to pay you a dividend; increases leverage—ensure debt capacity.',
        'best_for': 'Quick liquidity with strong, stable cash flows'
    },
    'royalty_licensing': {
        'name': 'Royalty / Licensing / Franchising',
        'category': 'Partial - Liquidity',
        'description': 'Monetize IP/brand while retaining core ops; slower liquidity, but scalable.',
        'best_for': 'Strong IP or brand that can be licensed'
    },
    'spin_off': {
        'name': 'Spin-off / Carve-out',
        'category': 'Restructuring',
        'description': 'Unlock value or simplify the business pre-exit.',
        'best_for': 'Complex businesses with separable divisions'
    },
    'orderly_liquidation': {
        'name': 'Orderly Liquidation of Assets',
        'category': 'Liquidation',
        'description': 'When going-concern value is weak; faster wind-down, typically lower total proceeds.',
        'best_for': 'Distressed situations or declining businesses'
    }
}


def calculate_exit_scores(responses):
    """
    Calculate scores for each exit strategy based on quiz responses.
    Returns a dictionary of scores and top 3 recommendations.
    """
    scores = {strategy: 0 for strategy in EXIT_STRATEGIES.keys()}

    # Extract responses for easier access
    r = {q['id']: responses.get(q['id']) for q in QUIZ_QUESTIONS}

    # Q1: Primary goal
    if r['Q1'] == 'max_price':
        scores['strategic_sale'] += 10
        scores['pe_full_sale'] += 8
        scores['ipo_spac'] += 6
    elif r['Q1'] == 'preserve_legacy':
        scores['esop'] += 10
        scores['family_succession'] += 9
        scores['employee_coop'] += 8
        scores['mbo'] += 7
    elif r['Q1'] == 'support_team':
        scores['esop'] += 10
        scores['employee_coop'] += 9
        scores['mbo'] += 7
    elif r['Q1'] == 'quick_liquidity':
        scores['strategic_sale'] += 9
        scores['pe_full_sale'] += 10
        scores['dividend_recap'] += 7
    elif r['Q1'] == 'gradual_transition':
        scores['pe_recap'] += 10
        scores['minority_sale'] += 9
        scores['family_succession'] += 7

    # Q2: Timeline
    if r['Q2'] == 'immediate':
        scores['strategic_sale'] += 8
        scores['dividend_recap'] += 7
        scores['orderly_liquidation'] += 5
    elif r['Q2'] == 'near_term':
        scores['pe_full_sale'] += 8
        scores['strategic_sale'] += 7
        scores['mbo'] += 6
    elif r['Q2'] == 'medium_term':
        scores['pe_recap'] += 8
        scores['minority_sale'] += 7
        scores['esop'] += 7
        scores['family_succession'] += 6
    elif r['Q2'] == 'long_term':
        scores['family_succession'] += 9
        scores['esop'] += 8
        scores['minority_sale'] += 7
        scores['ipo_spac'] += 6
    elif r['Q2'] == 'flexible':
        # Add small bonus to all viable options
        for strategy in ['strategic_sale', 'pe_full_sale', 'mbo', 'minority_sale']:
            scores[strategy] += 3

    # Q3: Post-transaction involvement
    if r['Q3'] == 'not_important':
        scores['strategic_sale'] += 8
        scores['pe_full_sale'] += 7
        scores['orderly_liquidation'] += 5
    elif r['Q3'] == 'short_transition':
        scores['pe_full_sale'] += 8
        scores['strategic_sale'] += 7
        scores['mbo'] += 6
    elif r['Q3'] == 'moderate':
        scores['pe_recap'] += 9
        scores['minority_sale'] += 8
        scores['family_succession'] += 6
    elif r['Q3'] == 'very_important':
        scores['pe_recap'] += 10
        scores['minority_sale'] += 9
        scores['family_succession'] += 8
        scores['royalty_licensing'] += 7
    elif r['Q3'] == 'advisory':
        scores['mbo'] += 8
        scores['esop'] += 7
        scores['family_succession'] += 6

    # Q4: Revenue range
    if r['Q4'] == 'under_1m':
        scores['family_succession'] += 6
        scores['mbo'] += 5
        scores['orderly_liquidation'] += 4
        # Penalize options requiring scale
        scores['ipo_spac'] -= 10
        scores['pe_full_sale'] -= 3
    elif r['Q4'] == '1m_5m':
        scores['mbo'] += 7
        scores['strategic_sale'] += 6
        scores['family_succession'] += 5
        scores['esop'] += 5
        scores['ipo_spac'] -= 8
    elif r['Q4'] == '5m_20m':
        scores['pe_full_sale'] += 8
        scores['strategic_sale'] += 8
        scores['esop'] += 7
        scores['pe_recap'] += 6
        scores['mbo'] += 6
    elif r['Q4'] == '20m_50m':
        scores['pe_full_sale'] += 10
        scores['strategic_sale'] += 9
        scores['pe_recap'] += 8
        scores['esop'] += 7
        scores['ipo_spac'] += 4
    elif r['Q4'] == 'over_50m':
        scores['strategic_sale'] += 10
        scores['pe_full_sale'] += 9
        scores['ipo_spac'] += 8
        scores['merger_equals'] += 7
        scores['pe_recap'] += 7

    # Q5: EBITDA margin
    if r['Q5'] == 'negative':
        scores['orderly_liquidation'] += 8
        scores['spin_off'] += 5
        # Penalize all M&A options
        for strategy in ['strategic_sale', 'pe_full_sale', 'pe_recap', 'mbo', 'esop']:
            scores[strategy] -= 5
    elif r['Q5'] == 'low':
        scores['strategic_sale'] += 5
        scores['spin_off'] += 4
        scores['minority_sale'] += 4
        scores['pe_full_sale'] -= 2
    elif r['Q5'] == 'moderate':
        scores['pe_full_sale'] += 7
        scores['strategic_sale'] += 7
        scores['mbo'] += 6
        scores['esop'] += 6
    elif r['Q5'] == 'strong':
        scores['pe_full_sale'] += 10
        scores['strategic_sale'] += 9
        scores['pe_recap'] += 8
        scores['esop'] += 8
        scores['dividend_recap'] += 7
    elif r['Q5'] == 'very_strong':
        scores['strategic_sale'] += 10
        scores['pe_full_sale'] += 10
        scores['dividend_recap'] += 9
        scores['pe_recap'] += 9
        scores['esop'] += 8

    # Q6: Management team capability
    if r['Q6'] == 'highly_capable':
        scores['mbo'] += 10
        scores['esop'] += 9
        scores['pe_full_sale'] += 8
        scores['strategic_sale'] += 7
    elif r['Q6'] == 'mostly_capable':
        scores['mbo'] += 7
        scores['esop'] += 6
        scores['pe_recap'] += 7
        scores['minority_sale'] += 6
    elif r['Q6'] == 'developing':
        scores['pe_recap'] += 6
        scores['minority_sale'] += 6
        scores['family_succession'] += 5
        scores['mbo'] -= 3
        scores['esop'] -= 3
    elif r['Q6'] == 'limited':
        scores['strategic_sale'] += 5  # Buyer brings management
        scores['family_succession'] += 4
        scores['mbo'] -= 7
        scores['esop'] -= 7
        scores['pe_full_sale'] -= 3
    elif r['Q6'] == 'none':
        scores['strategic_sale'] += 6  # Asset value focus
        scores['orderly_liquidation'] += 5
        scores['mbo'] -= 10
        scores['esop'] -= 10
        scores['pe_full_sale'] -= 5

    # Q7: Internal successor
    if r['Q7'] == 'yes_ready':
        scores['family_succession'] += 10
        scores['mbo'] += 7
    elif r['Q7'] == 'yes_training':
        scores['family_succession'] += 8
        scores['mbo'] += 5
        scores['minority_sale'] += 5  # Get partner to help develop
    elif r['Q7'] == 'maybe':
        scores['family_succession'] += 5
        scores['mbo'] += 4
    elif r['Q7'] == 'no':
        scores['strategic_sale'] += 5
        scores['pe_full_sale'] += 5
        scores['esop'] += 4
    elif r['Q7'] == 'not_interested':
        scores['strategic_sale'] += 6
        scores['pe_full_sale'] += 6
        scores['esop'] += 5
        scores['family_succession'] -= 10

    # Q8: Culture/employee preservation importance
    if r['Q8'] == 'critical':
        scores['esop'] += 10
        scores['employee_coop'] += 9
        scores['family_succession'] += 7
        scores['mbo'] += 7
        scores['strategic_sale'] -= 5
    elif r['Q8'] == 'very_important':
        scores['esop'] += 8
        scores['mbo'] += 7
        scores['family_succession'] += 6
        scores['pe_recap'] += 5
    elif r['Q8'] == 'somewhat_important':
        scores['esop'] += 5
        scores['mbo'] += 5
        scores['pe_full_sale'] += 3
    elif r['Q8'] == 'not_priority':
        scores['strategic_sale'] += 4
        scores['pe_full_sale'] += 4
    elif r['Q8'] == 'indifferent':
        scores['strategic_sale'] += 5
        scores['pe_full_sale'] += 5
        scores['orderly_liquidation'] += 3

    # Q9: Customer concentration
    if r['Q9'] == 'highly_diversified':
        scores['pe_full_sale'] += 8
        scores['strategic_sale'] += 7
        scores['esop'] += 7
        scores['ipo_spac'] += 6
    elif r['Q9'] == 'diversified':
        scores['pe_full_sale'] += 7
        scores['strategic_sale'] += 6
        scores['esop'] += 6
        scores['mbo'] += 6
    elif r['Q9'] == 'moderate':
        scores['strategic_sale'] += 5
        scores['pe_recap'] += 5
        scores['mbo'] += 4
    elif r['Q9'] == 'concentrated':
        scores['strategic_sale'] += 6  # May be valuable to strategic
        scores['minority_sale'] += 4  # Partner can help diversify
        scores['pe_full_sale'] -= 3
        scores['esop'] -= 3
    elif r['Q9'] == 'highly_concentrated':
        scores['strategic_sale'] += 5
        scores['orderly_liquidation'] += 3
        scores['pe_full_sale'] -= 5
        scores['esop'] -= 5
        scores['mbo'] -= 4

    # Q10: Recurring revenue
    if r['Q10'] == 'high_recurring':
        scores['pe_full_sale'] += 10
        scores['strategic_sale'] += 8
        scores['esop'] += 8
        scores['dividend_recap'] += 7
    elif r['Q10'] == 'moderate_recurring':
        scores['pe_full_sale'] += 7
        scores['strategic_sale'] += 6
        scores['esop'] += 6
        scores['mbo'] += 6
    elif r['Q10'] == 'some_recurring':
        scores['strategic_sale'] += 5
        scores['pe_recap'] += 5
        scores['mbo'] += 4
    elif r['Q10'] == 'low_recurring':
        scores['strategic_sale'] += 4
        scores['minority_sale'] += 3
        scores['pe_full_sale'] -= 2
        scores['esop'] -= 2
    elif r['Q10'] == 'project_based':
        scores['strategic_sale'] += 3
        scores['orderly_liquidation'] += 2
        scores['pe_full_sale'] -= 3
        scores['esop'] -= 4

    # Q11: Debt capacity
    if r['Q11'] == 'strong':
        scores['mbo'] += 9
        scores['esop'] += 9
        scores['dividend_recap'] += 8
        scores['pe_recap'] += 7
    elif r['Q11'] == 'moderate':
        scores['mbo'] += 6
        scores['esop'] += 6
        scores['dividend_recap'] += 5
    elif r['Q11'] == 'limited':
        scores['strategic_sale'] += 4
        scores['pe_full_sale'] += 3
        scores['mbo'] -= 3
        scores['esop'] -= 3
        scores['dividend_recap'] -= 5
    elif r['Q11'] == 'none':
        scores['strategic_sale'] += 4
        scores['family_succession'] += 3
        scores['mbo'] -= 7
        scores['esop'] -= 7
        scores['dividend_recap'] -= 10
    elif r['Q11'] == 'uncertain':
        # Neutral - add to strategies that can work either way
        scores['strategic_sale'] += 2
        scores['minority_sale'] += 2

    # Q12: Seller financing willingness
    if r['Q12'] == 'no_cash_only':
        scores['strategic_sale'] += 7
        scores['pe_full_sale'] += 7
        scores['dividend_recap'] += 6
        scores['mbo'] -= 5
        scores['family_succession'] -= 3
    elif r['Q12'] == 'small_portion':
        scores['pe_full_sale'] += 5
        scores['strategic_sale'] += 4
        scores['mbo'] += 3
    elif r['Q12'] == 'moderate':
        scores['mbo'] += 7
        scores['family_succession'] += 6
        scores['pe_full_sale'] += 4
    elif r['Q12'] == 'substantial':
        scores['mbo'] += 9
        scores['family_succession'] += 8
        scores['esop'] += 5
    elif r['Q12'] == 'flexible':
        scores['mbo'] += 10
        scores['family_succession'] += 9
        scores['esop'] += 7
        scores['employee_coop'] += 6

    # Q13: IP/Strategic assets
    if r['Q13'] == 'strong_ip':
        scores['strategic_sale'] += 10
        scores['ipo_spac'] += 7
        scores['royalty_licensing'] += 10
        scores['minority_sale'] += 6
    elif r['Q13'] == 'proprietary':
        scores['strategic_sale'] += 9
        scores['pe_full_sale'] += 7
        scores['royalty_licensing'] += 8
        scores['minority_sale'] += 6
    elif r['Q13'] == 'strategic_assets':
        scores['strategic_sale'] += 9
        scores['merger_equals'] += 6
        scores['pe_full_sale'] += 6
    elif r['Q13'] == 'some':
        scores['strategic_sale'] += 5
        scores['pe_full_sale'] += 4
    elif r['Q13'] == 'commodity':
        scores['mbo'] += 4
        scores['esop'] += 4
        scores['orderly_liquidation'] += 3
        scores['strategic_sale'] -= 3

    # Q14: Scalability
    if r['Q14'] == 'highly_scalable':
        scores['ipo_spac'] += 10
        scores['pe_recap'] += 9
        scores['minority_sale'] += 9
        scores['strategic_sale'] += 7
        scores['pe_full_sale'] += 7
    elif r['Q14'] == 'moderately_scalable':
        scores['pe_recap'] += 7
        scores['minority_sale'] += 7
        scores['strategic_sale'] += 6
        scores['pe_full_sale'] += 6
    elif r['Q14'] == 'steady_growth':
        scores['mbo'] += 6
        scores['esop'] += 6
        scores['family_succession'] += 5
        scores['pe_full_sale'] += 4
    elif r['Q14'] == 'mature':
        scores['strategic_sale'] += 5
        scores['dividend_recap'] += 5
        scores['mbo'] += 4
        scores['orderly_liquidation'] += 3
    elif r['Q14'] == 'declining':
        scores['orderly_liquidation'] += 8
        scores['strategic_sale'] += 4  # May have value to consolidator
        for strategy in ['ipo_spac', 'pe_recap', 'minority_sale', 'pe_full_sale']:
            scores[strategy] -= 5

    # Q15: Strategic buyers
    if r['Q15'] == 'multiple_strategic':
        scores['strategic_sale'] += 10
        scores['merger_equals'] += 7
    elif r['Q15'] == 'some_strategic':
        scores['strategic_sale'] += 8
        scores['merger_equals'] += 5
    elif r['Q15'] == 'maybe':
        scores['strategic_sale'] += 5
        scores['pe_full_sale'] += 3
    elif r['Q15'] == 'unlikely':
        scores['mbo'] += 5
        scores['esop'] += 5
        scores['family_succession'] += 4
        scores['strategic_sale'] -= 5
    elif r['Q15'] == 'dont_know':
        # Neutral - no impact
        pass

    # Q16: Due diligence readiness
    if r['Q16'] == 'full_scrutiny':
        scores['strategic_sale'] += 8
        scores['pe_full_sale'] += 8
        scores['ipo_spac'] += 6
    elif r['Q16'] == 'standard':
        scores['strategic_sale'] += 6
        scores['pe_full_sale'] += 6
        scores['mbo'] += 5
    elif r['Q16'] == 'light_preferred':
        scores['family_succession'] += 6
        scores['mbo'] += 5
        scores['minority_sale'] += 4
    elif r['Q16'] == 'concerns':
        scores['family_succession'] += 5
        scores['mbo'] += 4
        scores['strategic_sale'] -= 3
        scores['pe_full_sale'] -= 3
    elif r['Q16'] == 'significant_concerns':
        scores['orderly_liquidation'] += 4
        scores['family_succession'] += 3
        for strategy in ['strategic_sale', 'pe_full_sale', 'ipo_spac', 'esop']:
            scores[strategy] -= 5

    # Q17: Partner vs. full sale
    if r['Q17'] == 'prefer_partner':
        scores['pe_recap'] += 10
        scores['minority_sale'] += 10
        scores['strategic_sale'] -= 5
        scores['pe_full_sale'] -= 5
    elif r['Q17'] == 'open':
        scores['pe_recap'] += 7
        scores['minority_sale'] += 7
        scores['strategic_sale'] += 3
        scores['pe_full_sale'] += 3
    elif r['Q17'] == 'prefer_full_sale':
        scores['strategic_sale'] += 7
        scores['pe_full_sale'] += 7
        scores['mbo'] += 5
    elif r['Q17'] == 'full_sale_only':
        scores['strategic_sale'] += 9
        scores['pe_full_sale'] += 9
        scores['mbo'] += 7
        scores['esop'] += 7
        scores['pe_recap'] -= 5
        scores['minority_sale'] -= 5
    elif r['Q17'] == 'uncertain':
        # Add small bonus to flexible options
        for strategy in ['pe_recap', 'minority_sale', 'strategic_sale']:
            scores[strategy] += 2

    # Q18: Tax considerations
    if r['Q18'] == 'critical':
        scores['esop'] += 9  # Tax-advantaged
        scores['family_succession'] += 8  # Estate planning
        scores['pe_recap'] += 5  # Partial gain recognition
    elif r['Q18'] == 'very_important':
        scores['esop'] += 7
        scores['family_succession'] += 6
        scores['pe_recap'] += 4
    elif r['Q18'] == 'important':
        scores['esop'] += 5
        scores['family_succession'] += 4
    elif r['Q18'] == 'minor':
        # Neutral
        pass
    elif r['Q18'] == 'not_concerned':
        scores['strategic_sale'] += 3
        scores['pe_full_sale'] += 3

    # Q19: Risk tolerance
    if r['Q19'] == 'no_tolerance':
        scores['strategic_sale'] += 8
        scores['pe_full_sale'] += 8
        scores['dividend_recap'] += 6
        scores['pe_recap'] -= 5
        scores['minority_sale'] -= 3
    elif r['Q19'] == 'minimal':
        scores['pe_full_sale'] += 6
        scores['strategic_sale'] += 6
        scores['mbo'] += 4
    elif r['Q19'] == 'moderate':
        scores['pe_recap'] += 7
        scores['minority_sale'] += 6
        scores['mbo'] += 5
    elif r['Q19'] == 'high':
        scores['pe_recap'] += 9
        scores['minority_sale'] += 9
        scores['ipo_spac'] += 6
    elif r['Q19'] == 'entrepreneur':
        scores['minority_sale'] += 10
        scores['pe_recap'] += 10
        scores['ipo_spac'] += 8
        scores['royalty_licensing'] += 7

    # Q20: Employee benefit priority
    if r['Q20'] == 'critical_priority':
        scores['esop'] += 10
        scores['employee_coop'] += 10
        scores['mbo'] += 7
    elif r['Q20'] == 'very_important':
        scores['esop'] += 8
        scores['employee_coop'] += 7
        scores['mbo'] += 6
    elif r['Q20'] == 'somewhat_important':
        scores['esop'] += 5
        scores['mbo'] += 4
    elif r['Q20'] == 'not_priority':
        scores['strategic_sale'] += 3
        scores['pe_full_sale'] += 3
    elif r['Q20'] == 'no_employees':
        scores['family_succession'] += 4
        scores['strategic_sale'] += 3
        scores['esop'] -= 10
        scores['employee_coop'] -= 10
        scores['mbo'] -= 5

    # Filter out strategies with negative or very low scores
    viable_scores = {k: v for k, v in scores.items() if v > 10}

    # If no viable scores, take top scores anyway
    if not viable_scores:
        viable_scores = scores

    # Sort by score
    sorted_strategies = sorted(viable_scores.items(), key=lambda x: x[1], reverse=True)

    # Get top 3
    top_3 = [strategy for strategy, score in sorted_strategies[:3]]

    return {
        'all_scores': scores,
        'viable_scores': viable_scores,
        'top_recommendations': top_3,
        'detailed_results': [
            {
                'strategy': strategy,
                'score': score,
                **EXIT_STRATEGIES[strategy]
            }
            for strategy, score in sorted_strategies[:10]  # Top 10 for detailed view
        ]
    }
