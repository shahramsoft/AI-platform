import {
    ChatRequest,
    ChatResponse
} from "@aspedan-ai-platform/ai-core";

export interface AIProvider {

    chat(
        request: ChatRequest
    ): Promise<ChatResponse>;

    listModels(): Promise<string[]>;

    health(): Promise<boolean>;
}