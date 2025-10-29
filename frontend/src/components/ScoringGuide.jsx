import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

const ScoringGuide = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Collapsible Scoring Guide Card - with extra bottom margin to prevent overlap */}
      <div className="bg-white rounded-lg border-2 border-gray-300 shadow-sm mb-12">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition rounded-t-lg"
        >
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold text-gray-900">
              Assessment Scoring Guide
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHelp(true);
              }}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition"
              title="Learn more about Clear, Documented, & Transferable"
            >
              <HelpCircle size={18} />
              <span className="text-xs font-medium">What does "Clear, Documented, & Transferable" mean?</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-sm">{isCollapsed ? 'Show' : 'Hide'}</span>
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </button>

        {/* Collapsible Content - Tighter margins and spacing */}
        {!isCollapsed && (
          <div className="px-4 pb-4">
            {/* Scoring Image with tighter spacing and controlled height */}
            <div className="flex justify-center">
              <img 
                src="/scoring-guide.png" 
                alt="Assessment Scoring Guide" 
                className="w-full h-auto rounded"
                style={{ maxHeight: '220px', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Help Modal - Above entire assessment modal structure including progress bars */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Understanding "Clear, Documented, & Transferable"
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Introduction */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-gray-700 leading-relaxed">
                  These three attributes represent the <strong>gold standard</strong> for business processes, 
                  systems, and operations that maximize transferable value. Buyers pay premium prices for 
                  businesses that can run independently of the current owner.
                </p>
              </div>

              {/* Clear */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                    1
                  </span>
                  Clear
                </h3>
                <div className="ml-11 space-y-2">
                  <p className="text-gray-700">
                    <strong>Definition:</strong> Processes and responsibilities are unambiguous, easy to understand, 
                    and consistently executed.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-2">Examples:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Step-by-step sales process that anyone can follow</li>
                      <li>Defined roles with explicit job descriptions</li>
                      <li>Straightforward pricing methodology</li>
                      <li>Transparent financial reporting with clear KPIs</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="font-semibold text-red-800 mb-2">Red Flags (Not Clear):</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                      <li>"We just figure it out as we go"</li>
                      <li>Tribal knowledge that only veterans understand</li>
                      <li>Inconsistent execution across team members</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Documented */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                    2
                  </span>
                  Documented
                </h3>
                <div className="ml-11 space-y-2">
                  <p className="text-gray-700">
                    <strong>Definition:</strong> Written procedures, policies, and systems exist that can be 
                    referenced, updated, and used for training.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-2">Examples:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Standard Operating Procedures (SOPs) for key processes</li>
                      <li>Employee handbook and training manuals</li>
                      <li>Written contracts and agreements with customers/vendors</li>
                      <li>Organizational charts and process flowcharts</li>
                      <li>Knowledge base or wiki for common issues</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="font-semibold text-red-800 mb-2">Red Flags (Not Documented):</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                      <li>"It's all in my head" or "I'll show the new owner"</li>
                      <li>No written procedures or manuals</li>
                      <li>Reliance on verbal instructions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Transferable */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                    3
                  </span>
                  Transferable
                </h3>
                <div className="ml-11 space-y-2">
                  <p className="text-gray-700">
                    <strong>Definition:</strong> The system can be effectively handed off to a new person without 
                    significant loss of efficiency or quality. The business doesn't depend on any single individual.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-2">Examples:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>New employees can be onboarded using documentation</li>
                      <li>Customer relationships aren't tied to one person</li>
                      <li>Systems and software can be accessed by others</li>
                      <li>Vendor relationships are company-based, not personal</li>
                      <li>Management team can operate without owner</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="font-semibold text-red-800 mb-2">Red Flags (Not Transferable):</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                      <li>Owner is the only one who can perform critical functions</li>
                      <li>Key relationships would leave with owner</li>
                      <li>Passwords, accounts only accessible to owner</li>
                      <li>Long training period required for handoff</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Why It Matters */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h4 className="font-bold text-yellow-900 mb-2">💡 Why This Matters for Exit Value</h4>
                <p className="text-yellow-800 text-sm leading-relaxed">
                  Buyers pay <strong>2-4x more</strong> for businesses with clear, documented, and transferable 
                  systems because they reduce risk and enable a smooth transition. A business that depends on 
                  the owner's personal knowledge and relationships is worth significantly less than one that 
                  operates like a well-oiled machine.
                </p>
              </div>

              {/* Scoring Guide */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-3">Assessment Scoring Scale (0-6):</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center bg-[#c49e73] text-white border-2 border-[#a07d5a]">6</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Exemplary & Optimized</p>
                      <p className="text-xs text-gray-600">Fully clear, comprehensively documented, and seamlessly transferable. Best-in-class execution with no meaningful improvements needed.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">5</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Clear, Documented & Transferable</p>
                      <p className="text-xs text-gray-600">Meets all three core criteria with strong execution. Minor refinements possible but fundamentally sound and ready for transition.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">4</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Clear & Documented, Not Yet Transferable</p>
                      <p className="text-xs text-gray-600">Well-defined and properly documented, but remains dependent on specific individuals. Requires knowledge transfer planning to reduce key person risk.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">3</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Clear But Lacking Documentation</p>
                      <p className="text-xs text-gray-600">Processes are understood and consistently executed, but not formally written down. Institutional knowledge exists but isn't captured in accessible formats.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">2</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Conceptually Understood, Poorly Defined</p>
                      <p className="text-xs text-gray-600">You recognize the importance and generally understand the concept, but execution is inconsistent, unclear, or varies by person. Needs structure and standardization.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">1</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Unfamiliar or Absent</p>
                      <p className="text-xs text-gray-600">This area is not currently addressed in your business, or you're unclear on what the question is asking. Represents a significant gap requiring immediate attention.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">0</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Not Applicable (N/A)</p>
                      <p className="text-xs text-gray-600">This question does not apply to your business model or industry. These responses are excluded from your final score calculation.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScoringGuide;
