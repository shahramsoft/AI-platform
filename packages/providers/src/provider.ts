import {
    ChatRequest,
    ChatResponse
} from "../../core/src/types/chat";
//"@aspedan/core";

export interface AIProvider {

    chat(
        request: ChatRequest
    ): Promise<ChatResponse>;

    listModels(): Promise<string[]>;

    health(): Promise<boolean>;
}

export { ChatRequest, ChatResponse };
