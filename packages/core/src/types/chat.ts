export interface ChatMessage {

    role: "system" | "user" | "assistant";

    content: string;
}

export interface ChatRequest {

    model: string;

    messages: ChatMessage[];
}

export interface ChatResponse {

    content: string;
}