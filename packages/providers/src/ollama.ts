import { AIProvider, ChatRequest, ChatResponse } from "./provider";

export class OllamaProvider
    implements AIProvider {

    async chat(request: ChatRequest): Promise<ChatResponse> {

        throw new Error(
            "Not implemented"
        );
    }

    async listModels() {

        return [];
    }

    async health() {

        return true;
    }
}