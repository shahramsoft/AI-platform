export default async function (
    fastify
) {

    fastify.get(
        "/health",
        async () => {

            return {

                status: "ok",

                version: "0.1"

            };

        }
    );

}