export const dynamic = "force-dynamic";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { PlanGate } from "@/components/plan-gate";

export default function AiPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">ИИ-ассистент</h1>
        <p className="text-sm text-gray-500 mt-1">
          Задайте вопрос по финансам вашей компании
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <PlanGate feature="aiAssistant">
          <AiChatPanel />
        </PlanGate>
      </div>
    </div>
  );
}
