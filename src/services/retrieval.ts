import { KBEntry, KBCategory, Order, Message, GenerationStatus } from '../types/database';

export interface RetrievalResult {
  status: GenerationStatus;
  matchedPolicies: KBEntry[];
  missingInformation: string[];
  warnings: string[];
  ruleEvaluationDetails?: {
    daysSinceDelivery?: number;
    hoursSinceDelivery?: number;
    windowDays?: number;
    isWithinWindow?: boolean;
    requiresPhotos?: boolean;
    requiresOrderRef?: boolean;
    wasPreviouslyDenied?: boolean;
    denialCount?: number;
    isCustomerDisputeOrProfane?: boolean;
    hadPastWindowAdmission?: boolean;
    hasContradictoryTimelineClaim?: boolean;
    isCircularRepetition?: boolean;
    isPushbackAfterDenial?: boolean;
    shouldKillLoop?: boolean;
    loopKillReason?: string;
  };
}

// Canonical synonym groups mapping customer terms to KB categories
const SYNONYM_MAP: Record<string, KBCategory[]> = {
  broken: ['damage', 'returns', 'refunds'],
  broke: ['damage', 'returns', 'refunds'],
  damage: ['damage', 'returns', 'refunds'],
  damaged: ['damage', 'returns', 'refunds'],
  cracked: ['damage', 'returns', 'refunds'],
  shattered: ['damage', 'returns', 'refunds'],
  defective: ['damage', 'returns', 'refunds'],
  leaking: ['damage', 'returns', 'refunds'],
  chipped: ['damage', 'returns', 'refunds'],
  dent: ['damage', 'returns', 'refunds'],
  dented: ['damage', 'returns', 'refunds'],
  torn: ['damage', 'returns', 'refunds'],
  tear: ['damage', 'returns', 'refunds'],
  ripped: ['damage', 'returns', 'refunds'],
  zipper: ['damage', 'returns', 'refunds'],
  seam: ['damage', 'returns', 'refunds'],
  strap: ['damage', 'returns', 'refunds'],
  buckle: ['damage', 'returns', 'refunds'],
  clasp: ['damage', 'returns', 'refunds'],
  hardware: ['damage', 'returns', 'refunds'],
  handle: ['damage', 'returns', 'refunds'],
  scratch: ['damage', 'returns', 'refunds'],
  scratched: ['damage', 'returns', 'refunds'],
  scuff: ['damage', 'returns', 'refunds'],
  stained: ['damage', 'returns', 'refunds'],
  flaw: ['damage', 'returns', 'refunds'],

  return: ['returns', 'refunds'],
  returns: ['returns', 'refunds'],
  retrun: ['returns', 'refunds'],
  retur: ['returns', 'refunds'],
  retun: ['returns', 'refunds'],
  reutrn: ['returns', 'refunds'],
  reurn: ['returns', 'refunds'],
  rturn: ['returns', 'refunds'],
  returning: ['returns', 'refunds'],
  returned: ['returns', 'refunds'],
  'send back': ['returns', 'refunds'],
  exchange: ['returns', 'refunds'],
  exchnage: ['returns', 'refunds'],
  exhcange: ['returns', 'refunds'],
  goods: ['returns', 'refunds'],
  item: ['returns', 'refunds'],
  items: ['returns', 'refunds'],
  product: ['returns', 'refunds'],
  products: ['returns', 'refunds'],
  order: ['returns', 'refunds'],
  color: ['returns', 'refunds'],
  colour: ['returns', 'refunds'],
  size: ['returns', 'refunds'],
  fit: ['returns', 'refunds'],
  tight: ['returns', 'refunds'],
  loose: ['returns', 'refunds'],

  refund: ['refunds', 'returns'],
  refunds: ['refunds', 'returns'],
  refnd: ['refunds', 'returns'],
  refun: ['refunds', 'returns'],
  rfund: ['refunds', 'returns'],
  'money back': ['refunds'],
  reimbursement: ['refunds'],

  shipping: ['shipping'],
  delivery: ['shipping'],
  track: ['shipping'],
  tracking: ['shipping'],
  courier: ['shipping'],
  dispatch: ['shipping'],
  transit: ['shipping'],

  cancel: ['cancellation'],
  cancellation: ['cancellation'],
  cancelling: ['cancellation'],
  cancelled: ['cancellation']
};

function matchesTerm(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
  return regex.test(text);
}

/**
 * Deterministic Knowledge Retrieval and Rule Evaluation Engine
 * Bounded to authorized brand policies and recent conversation messages.
 */
export function retrieveBrandKnowledgeAndEvaluateRules(
  brandId: string,
  messages: Message[],
  brandPolicies: KBEntry[],
  order?: Order | null
): RetrievalResult {
  // 1. Enforce strict brand filter on active policies only
  const activeBrandPolicies = brandPolicies.filter(
    (p) => p.brand_id === brandId && p.active
  );

  // 2. Synthesize text from the recent bounded customer messages
  const recentCustomerMessages = messages
    .filter((m) => m.sender_type === 'customer')
    .slice(-3);

  const queryText = recentCustomerMessages.map((m) => m.body.toLowerCase()).join(' ');

  // 3. Match categories via synonym groups with word boundaries
  const matchedCategories = new Set<KBCategory>();

  const scanTextForCategories = (text: string) => {
    for (const [term, categories] of Object.entries(SYNONYM_MAP)) {
      if (matchesTerm(text, term)) {
        for (const cat of categories) {
          matchedCategories.add(cat);
        }
      }
    }
    const supportedCategories: KBCategory[] = ['returns', 'refunds', 'shipping', 'cancellation', 'damage'];
    for (const cat of supportedCategories) {
      if (matchesTerm(text, cat)) {
        matchedCategories.add(cat);
      }
    }
  };

  // First check recent customer messages
  scanTextForCategories(queryText);

  // If latest messages were brief (e.g. order numbers, dates, or responses), scan earlier conversation history
  if (matchedCategories.size === 0 && messages.length > 0) {
    const threadText = messages.map((m) => m.body.toLowerCase()).join(' ');
    scanTextForCategories(threadText);
  }

  // Detect prior support agent decisions (e.g. request was already denied or rejected)
  const agentMessages = messages.filter((m) => m.sender_type === 'agent');
  const priorAgentDenials = agentMessages.filter((m) => {
    const body = m.body.toLowerCase();
    return (
      body.includes('unable to process') ||
      body.includes('exceeds our') ||
      body.includes('cannot authorize') ||
      body.includes('outside our') ||
      body.includes('cannot process') ||
      body.includes('cannot accept') ||
      body.includes('cannot refund') ||
      body.includes('does not fall under') ||
      body.includes('not eligible') ||
      body.includes('ineligible') ||
      body.includes('cannot be returned') ||
      body.includes('past the') ||
      body.includes('exceeds the') ||
      body.includes('determination on this matter is final') ||
      body.includes('concluded and marked as resolved') ||
      body.includes('can only help with orders related')
    );
  });
  const denialCount = priorAgentDenials.length;
  const wasPreviouslyDenied = denialCount > 0;

  // Analyze customer messages across the entire thread for timeline admissions and contradictions
  const customerMessages = messages.filter((m) => m.sender_type === 'customer');
  const customerBodies = customerMessages.map((m) => m.body.toLowerCase());
  const lastCustomerMsg = customerBodies[customerBodies.length - 1] || '';

  // 1. Did the customer ever state/admit the item was from long ago (e.g. ordered a year back, months ago)?
  const pastWindowPattern = /\b(a year ago|year ago|year back|years back|years ago|last year|bought it last year|ordered it last year|ordered it a year|ordered a year|months ago|month ago|couple months|few months|ordered months ago|bought months ago|long time ago|bought it last|year old)\b/i;
  const hadPastWindowAdmission = customerBodies.some((b) => pastWindowPattern.test(b));

  // 2. Is customer now asserting recent receipt ("got it yesterday", "arrived yesterday", "just got it")?
  const recentClaimPattern = /\b(yesterday|today|just got it|just arrived|received it yesterday|got it yesterday|arrived yesterday|actually received|actually got it|delivered yesterday|delivered today)\b/i;
  const isClaimingRecentNow = recentClaimPattern.test(lastCustomerMsg);

  // 3. Flag contradiction if customer changes timeline or contradicts verified past admission
  const hasContradictoryTimelineClaim = hadPastWindowAdmission && (isClaimingRecentNow || wasPreviouslyDenied);

  // Detect hostile customer tone, disputes, or profanity in latest message
  const isCustomerDisputeOrProfane = /\b(fuck|shit|damn|hell|screw you|asshole|bitch|scam|ridiculous|unacceptable|thieves|liars|robbery)\b/i.test(lastCustomerMsg);

  // 4. Early Loop Detection: identify circular repetition, repeated off-topic, or repeated pushback after denial
  const customerCount = customerBodies.length;
  const isCircularRepetition =
    customerCount >= 2 &&
    (customerBodies[customerCount - 1].trim() === customerBodies[customerCount - 2].trim() ||
      (customerBodies[customerCount - 1].length < 35 && customerBodies[customerCount - 2].includes(customerBodies[customerCount - 1])) ||
      (customerBodies[customerCount - 1].includes('refund') && customerBodies[customerCount - 2].includes('refund')) ||
      (customerBodies[customerCount - 1].includes('return') && customerBodies[customerCount - 2].includes('return')));

  const isPushbackAfterDenial =
    wasPreviouslyDenied &&
    customerCount >= 2 &&
    (/\b(why|refund|return|money|unacceptable|ridiculous|need my|give me|want my|scam|hate|bitch|fuck|yesterday|actually|help|please|no|must)\b/i.test(lastCustomerMsg) ||
      isCustomerDisputeOrProfane ||
      hasContradictoryTimelineClaim ||
      isCircularRepetition);

  const isConsecutiveOffTopic =
    matchedCategories.size === 0 &&
    customerCount >= 2 &&
    priorAgentDenials.some((m) => m.body.toLowerCase().includes('can only help with orders related'));

  // Kill loops earlier:
  // - Support already issued 1+ denials and customer continues with pushback, profanity, contradiction, or circular queries
  // - Support already issued 2+ denials
  // - Consecutive off-topic messages
  const shouldKillLoop =
    (denialCount >= 1 && (isPushbackAfterDenial || isCustomerDisputeOrProfane || hasContradictoryTimelineClaim || isCircularRepetition)) ||
    denialCount >= 2 ||
    isConsecutiveOffTopic;

  const loopKillReason = shouldKillLoop
    ? isConsecutiveOffTopic
      ? 'Consecutive off-topic inquiries outside store scope.'
      : hasContradictoryTimelineClaim
      ? 'Customer persisting with contradictory timeline claims after prior policy refusal.'
      : isCircularRepetition
      ? 'Repeated circular inquiries without new verifiable details.'
      : 'Customer persisting after definitive policy determination.'
    : undefined;

  // If no knowledge domain matched, return no_relevant_knowledge
  if (matchedCategories.size === 0) {
    const noKnowledgeWarnings = [
      'No matching brand knowledge base policy was found for this customer inquiry. Advise agent caution and do not fabricate policy details.'
    ];
    if (shouldKillLoop && loopKillReason) {
      noKnowledgeWarnings.push(`Loop Killer Triggered: ${loopKillReason}`);
    }

    return {
      status: 'no_relevant_knowledge',
      matchedPolicies: [],
      missingInformation: [],
      warnings: noKnowledgeWarnings,
      ruleEvaluationDetails: {
        wasPreviouslyDenied,
        denialCount,
        isCustomerDisputeOrProfane,
        hadPastWindowAdmission,
        hasContradictoryTimelineClaim,
        isCircularRepetition,
        isPushbackAfterDenial,
        shouldKillLoop,
        loopKillReason
      }
    };
  }

  // 5. Select active policies belonging to the matched categories
  const matchedPolicies = activeBrandPolicies.filter((p) =>
    matchedCategories.has(p.category)
  );

  if (matchedPolicies.length === 0) {
    return {
      status: 'no_relevant_knowledge',
      matchedPolicies: [],
      missingInformation: [],
      warnings: [
        'Policies for the identified category are currently inactive or missing for this brand.'
      ]
    };
  }

  // 6. Evaluate Deterministic Numeric Rules & Facts
  const missingInformation: string[] = [];
  const warnings: string[] = [];
  let isWithinWindow = true;
  let daysSinceDelivery: number | undefined;
  let hoursSinceDelivery: number | undefined;
  let windowDays: number | undefined;
  let requiresPhotos: boolean | undefined;
  let requiresOrderRef: boolean | undefined;

  const isReturnOrRefundQuery = matchedCategories.has('returns') || matchedCategories.has('refunds');
  const isDamageQuery = matchedCategories.has('damage');

  if (isReturnOrRefundQuery || isDamageQuery) {
    if (!order) {
      if (hadPastWindowAdmission) {
        isWithinWindow = false;
        warnings.push('Customer explicitly stated item was ordered a year ago or in the distant past, exceeding store return/refund policy window. Decline return or refund.');
      } else {
        missingInformation.push('Order reference number is required to look up fulfillment and delivery dates.');
      }
    } else if (!order.delivered_at) {
      // Delivered date is unknown or item is in transit
      missingInformation.push(
        'Delivery date is unconfirmed. The customer-facing delivery date is required before calculating refund or damage eligibility.'
      );
      warnings.push('Item delivery date is unknown. Do not commit to return or refund eligibility until delivery is confirmed.');
    } else {
      // Calculate elapsed time in UTC/local milliseconds
      const deliveryTime = new Date(order.delivered_at).getTime();
      const nowTime = Date.now();
      const elapsedMs = Math.max(0, nowTime - deliveryTime);
      daysSinceDelivery = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
      hoursSinceDelivery = Math.floor(elapsedMs / (1000 * 60 * 60));

      // Check Refund / Return Window Policy Rules
      const refundPolicy = matchedPolicies.find((p) => p.category === 'returns' || p.category === 'refunds');
      if (refundPolicy?.rules_json?.window_days !== undefined) {
        windowDays = Number(refundPolicy.rules_json.window_days);
        if (daysSinceDelivery > windowDays) {
          isWithinWindow = false;
          warnings.push(
            `Order ${order.order_number} was delivered ${daysSinceDelivery} days ago, exceeding the ${windowDays}-day return/refund window. Decline return/refund unless explicit supervisory escalation applies.`
          );
        } else {
          warnings.push(
            `Order ${order.order_number} is within the ${windowDays}-day window (${daysSinceDelivery} days elapsed). Reminder: Eligibility is subject to condition inspection and does not constitute automatic approval.`
          );
        }
      }

      // Check Damage Report Window Policy Rules
      if (isDamageQuery) {
        const damagePolicy = matchedPolicies.find((p) => p.category === 'damage');
        requiresPhotos = damagePolicy?.rules_json?.requires_photos === true;
        requiresOrderRef = damagePolicy?.rules_json?.requires_order_ref ?? true;

        if (damagePolicy?.rules_json?.report_hours !== undefined) {
          const maxHours = Number(damagePolicy.rules_json.report_hours);
          if (hoursSinceDelivery > maxHours) {
            isWithinWindow = false;
            warnings.push(
              `Damage reported ${hoursSinceDelivery} hours after delivery, exceeding the ${maxHours}-hour reporting limit.`
            );
          }
        } else if (damagePolicy?.rules_json?.report_days !== undefined) {
          const maxDays = Number(damagePolicy.rules_json.report_days);
          if (daysSinceDelivery > maxDays) {
            isWithinWindow = false;
            warnings.push(
              `Damage reported ${daysSinceDelivery} days after delivery, exceeding the ${maxDays}-day reporting limit.`
            );
          }
        }

        if (requiresPhotos) {
          warnings.push('Photographic proof of damaged item and outer packaging is mandatory for claim processing.');
          missingInformation.push('Photographs of the damaged item and packaging.');
        }
      }
    }
  }

  // If customer is presenting a contradictory timeline (e.g. claiming received yesterday after previously stating ordered a year back)
  if (hasContradictoryTimelineClaim) {
    missingInformation.length = 0;
    isWithinWindow = false;
    warnings.push('CRITICAL: Customer provided contradictory delivery timeline (previously admitted item was ordered/received a year ago or months ago, now claiming received yesterday). Uphold policy limitation.');
  }

  // If customer previously admitted an out-of-window date, enforce denial
  if (hadPastWindowAdmission) {
    missingInformation.length = 0;
    isWithinWindow = false;
  }

  // If the request was previously denied, do not re-request missing info; uphold decision
  if (wasPreviouslyDenied) {
    missingInformation.length = 0;
    isWithinWindow = false;
    warnings.push('Customer is following up after a previous policy denial. Maintain firm, professional policy stance and de-escalate.');
  }

  if (shouldKillLoop && loopKillReason) {
    missingInformation.length = 0;
    isWithinWindow = false;
    warnings.push(`Loop Killer Triggered: ${loopKillReason} Kill loop early, issue final determination, and mark ticket resolved.`);
  }

  // Determine overall status
  let finalStatus: GenerationStatus = 'grounded';
  if (missingInformation.length > 0) {
    finalStatus = 'needs_information';
  } else if (!isWithinWindow) {
    // Grounded with restriction / rule violation
    finalStatus = 'grounded';
  }

  return {
    status: finalStatus,
    matchedPolicies,
    missingInformation,
    warnings,
    ruleEvaluationDetails: {
      daysSinceDelivery,
      hoursSinceDelivery,
      windowDays,
      isWithinWindow,
      requiresPhotos,
      requiresOrderRef,
      wasPreviouslyDenied,
      denialCount,
      isCustomerDisputeOrProfane,
      hadPastWindowAdmission,
      hasContradictoryTimelineClaim,
      isCircularRepetition,
      isPushbackAfterDenial,
      shouldKillLoop,
      loopKillReason
    }
  };
}
