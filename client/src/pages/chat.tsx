import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">Team Chat</h1>
        <ChatInterface />
      </div>
    </div>
  );
}
