import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { Copy, RefreshCcw } from "lucide-react"

const messages = [
  {
    id: 1,
    message: "Help me with my essay.",
    sender: "user",
  },
  {
    id: 2,
    message: "I can help you with that. What do you need help with?",
    sender: "bot",
  },
]

const actionIcons = [
  { icon: Copy, type: "Copy" },
  { icon: RefreshCcw, type: "Regenerate" },
]

export function ChatBubbleVariants() {
  return (
    <div className="max-w-md space-y-4 p-4">
      <ChatBubble variant="sent">
        <ChatBubbleAvatar fallback="US" className="bg-slate-100 text-slate-700 font-semibold" />
        <ChatBubbleMessage variant="sent">
          I have a question about the library.
        </ChatBubbleMessage>
      </ChatBubble>

      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" className="bg-blue-50 text-blue-700 font-semibold" />
        <ChatBubbleMessage>
          Sure, I'd be happy to help!
        </ChatBubbleMessage>
      </ChatBubble>
    </div>
  )
}

export function ChatBubbleAiLayout() {
  return (
    <div className="max-w-md divide-y">
      {messages.map((message, index) => {
        const variant = message.sender === "user" ? "sent" : "received"
        return (
          <div key={message.id} className="py-6 first:pt-0 last:pb-0">
            <div className="flex gap-3">
              <ChatBubbleAvatar 
                fallback={variant === "sent" ? "US" : "AI"} 
                className={variant === "sent" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"}
              />
              <div className="flex-1">
                {message.message}
                {message.sender === "bot" && (
                  <div className="flex gap-2 mt-2">
                    {actionIcons.map(({ icon: Icon, type }) => (
                      <button
                        key={type}
                        onClick={() => console.log(`Action ${type} clicked for message ${index}`)}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                      >
                        <Icon className="size-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ChatBubbleStates() {
  return (
    <div className="max-w-md space-y-4 p-4">
      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" />
        <ChatBubbleMessage isLoading />
      </ChatBubble>

      <ChatBubble variant="received">
        <ChatBubbleAvatar fallback="AI" />
        <ChatBubbleMessage className="bg-destructive/10 text-destructive">
          Error processing request
        </ChatBubbleMessage>
      </ChatBubble>
    </div>
  )
}
