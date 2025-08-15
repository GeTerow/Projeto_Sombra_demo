"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const PORT = parseInt(process.env.PORT || '3001', 10);
const startServer = () => {
    try {
        app_1.app.listen(PORT, '0.0.0.0', () => {
            console.log(`Backend Principal (Node.js) rodando na porta ${PORT}`);
            console.log(`Acesse http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("Não foi possível iniciar o servidor:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map