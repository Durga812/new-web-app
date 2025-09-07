// src/components/courses/GuidanceTable.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const tableData = [
  {
    category: "What it is",
    EB1A: "Green card petition for people with extraordinary ability and top achievements.",
    "EB2-NIW": "Green card petition for people whose work is in the national interest of the U.S.",
    "O-1": "Temporary work visa for people with extraordinary ability.",
    EB5: "Green card petition for people who make a qualifying investment in the U.S. and create jobs."
  },
  {
    category: "Who it's for",
    EB1A: "For individuals at the top of their field who can prove sustained acclaim and recognition.",
    "EB2-NIW": "For professionals whose work is of substantial merit and national importance to the U.S.",
    "O-1": "For individuals with extraordinary ability who want to work temporarily in the U.S. Although O‑1 is not a green card, it can be a stepping stone—letting you stay and work in the U.S. while you prepare and file EB‑1A or EB2‑NIW or while you wait for your H1B visa.",
    EB5: "For investors who can create U.S. jobs through significant financial investment."
  },
  {
    category: "Education required?",
    EB1A: "No — based on talent and recognition, not education.",
    "EB2-NIW": "Generally requires an advanced degree (Master's/PhD) or equivalent — unless extraordinary professional achievements justify waiver.",
    "O-1": "No — based on talent and recognition, not education.",
    EB5: "No — based only on money invested, not education."
  },
  {
    category: "What proof do I need?",
    EB1A: "Show a major, internationally recognized award or Show at least 3 out of 10 types of evidence (awards, media, memberships, publications, judging, etc.) plus meet the \"final merits\" test.",
    "EB2-NIW": "Show that your work is: 1) important to the U.S., 2) you're well positioned to do it, and 3) it's in the U.S. national interest to waive job/labor cert.",
    "O-1": "Show a major, internationally recognized award or at least 3 of 8 (O-1A) / 3 of 6 (O-1B) evidence types (awards, press, memberships, leading roles, high pay, etc.) plus meet the \"final merits\" test.",
    EB5: "Show proof of your qualifying investment and creation of at least 10 U.S. jobs."
  },
  {
    category: "Do I need a company to sponsor me or an attorney to file?",
    EB1A: "No — you can apply on your own (self-petition).",
    "EB2-NIW": "No — you can apply on your own (self-petition).",
    "O-1": "Yes — you need a U.S. employer or agent to file for you.",
    EB5: "No — you apply through your own investment (self-petition)."
  },
  {
    category: "Does it give me a green card?",
    EB1A: "Yes — permanent residency for you and your family.",
    "EB2-NIW": "Yes — permanent residency for you and your family.",
    "O-1": "No — it's a temporary visa (but it can help you work in the U.S. while preparing for EB1A or EB2-NIW green card).",
    EB5: "Yes — permanent residency for you and your family."
  },
  {
    category: "Who can apply from what visa?",
    EB1A: "Open to anyone worldwide — whether you are already in the U.S. (F-1 student, J-1 researcher, H-1B worker, O-1 visa holder, tourist, etc.) or applying from abroad without holding a U.S. visa",
    "EB2-NIW": "Open to anyone worldwide — whether you are already in the U.S. (F-1 student, J-1 researcher, H-1B worker, O-1 visa holder, tourist, etc.) or applying from abroad without holding a U.S. visa",
    "O-1": "Open to anyone worldwide — whether you are already in the U.S. (F-1 student, J-1 researcher, H-1B worker, O-1 visa holder, tourist, etc.) or applying from abroad without holding any U.S. visa — but you must have a U.S. employer or agent to sponsor the petition.",
    EB5: "Open to anyone worldwide — whether you are already in the U.S. (F-1 student, J-1 researcher, H-1B worker, O-1 visa holder, tourist, etc.) or applying from abroad without holding a U.S. visa who has the required funds."
  },
  {
    category: "Where can I apply from?",
    EB1A: "From inside the U.S.(change status) or outside(apply through U.S. consulate).",
    "EB2-NIW": "From inside the U.S.(change status) or outside(apply through U.S. consulate).",
    "O-1": "From inside or outside the U.S., but your employer/agent must file.",
    EB5: "From inside the U.S. (change status) or outside(apply through U.S. consulate)."
  },
  {
    category: "Processing time*",
    EB1A: "About 6–12 months (can speed up with Premium Processing ~15 business days for I-140).",
    "EB2-NIW": "About 12–18 months (can speed up with Premium Processing ~45 business days for I-140).",
    "O-1": "About 2–4 months normally; Premium Processing ~15 business days available.",
    EB5: "Usually 2–3+ years; no Premium Processing (some priority for rural/set-aside investments)."
  },
  {
    category: "Best fit for…",
    EB1A: "Researchers, entrepreneurs, industry leaders, artists, athletes.",
    "EB2-NIW": "Researchers, STEM experts, and entrepreneurs working in priority areas for the U.S.",
    "O-1": "Artists, performers, innovators, scientists — those needing temporary U.S. work status and later a green card path.",
    EB5: "High-net-worth individuals & families who want U.S. residency through investment."
  }
];

const categoryColors = {
  EB1A: "#f59e0b",
  "EB2-NIW": "#f97316", 
  "O-1": "#eab308",
  EB5: "#ef4444"
};

export function GuidanceTable() {
  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-4">
          Help Me Choose the Right Path
        </h2>
        <p className="text-lg text-gray-600">
          Compare different immigration options to find what fits you best
        </p>
      </div>
      
      <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-2xl">
        <CardContent className="p-0">
          {/* Mobile View - Cards */}
          <div className="block lg:hidden">
            {Object.keys(categoryColors).map((category) => (
              <div key={category} className="border-b border-gray-200 last:border-b-0">
                <div 
                  className="p-4 text-center font-bold text-white"
                  style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
                >
                  <h3 className="text-lg">{category}</h3>
                </div>
                <div className="p-4 space-y-4">
                  {tableData.map((row, index) => (
                    <div key={index} className="border-l-4 pl-4 py-2" style={{ borderColor: categoryColors[category as keyof typeof categoryColors] }}>
                      <div className="font-semibold text-gray-700 text-sm mb-1">
                        {row.category}
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {row[category as keyof typeof row]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-6 font-bold text-gray-800 bg-gray-50/80 backdrop-blur-sm min-w-[200px] border-r border-gray-200">
                    <div className="text-lg">Criteria</div>
                  </th>
                  {Object.keys(categoryColors).map((category) => (
                    <th 
                      key={category}
                      className="text-center p-6 font-bold text-white min-w-[280px] border-r border-white/20 last:border-r-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${categoryColors[category as keyof typeof categoryColors]}, ${categoryColors[category as keyof typeof categoryColors]}dd)`
                      }}
                    >
                      <div className="text-lg">{category}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr 
                    key={index}
                    className={`border-b border-gray-200 transition-all duration-200 hover:bg-gray-50/50 ${index % 2 === 0 ? 'bg-white/60' : 'bg-gray-50/40'}`}
                  >
                    <td className="p-6 font-semibold text-gray-800 bg-gray-50/60 backdrop-blur-sm border-r border-gray-200">
                      <div className="text-sm leading-relaxed">{row.category}</div>
                    </td>
                    <td className="p-6 text-sm text-gray-700 border-r border-gray-200 leading-relaxed">
                      {row.EB1A}
                    </td>
                    <td className="p-6 text-sm text-gray-700 border-r border-gray-200 leading-relaxed">
                      {row["EB2-NIW"]}
                    </td>
                    <td className="p-6 text-sm text-gray-700 border-r border-gray-200 leading-relaxed">
                      {row["O-1"]}
                    </td>
                    <td className="p-6 text-sm text-gray-700 leading-relaxed">
                      {row.EB5}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}