import { AIProvider } from "./provider";

export class OllamaProvider
implements AIProvider {

    async chat() {

        throw new Error(
            "Not implemented."
        );

    }

    async listModels() {

        return [];

    }

    async health() {

        return true;

    }

}