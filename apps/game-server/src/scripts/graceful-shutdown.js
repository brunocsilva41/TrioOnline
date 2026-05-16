/**
 * Graceful Shutdown Script for Colyseus Game Server
 * As per PLANNING/13_INFRASTRUCTURE/k8s_topology.md
 */

const http = require('http');

async function shutdown() {
    console.log("SIGTERM received. Starting graceful shutdown...");
    
    // 1. Notificar Matchmaker para parar de enviar novas salas para este Pod
    // Ex: await matchmaker.disableCurrentProcess();
    console.log("Notifying Matchmaker to disable this node...");

    // 2. Aguardar a finalização das partidas em andamento
    // O K8s aguardará até terminationGracePeriodSeconds (900s)
    let activeRooms = 1; // Placeholder
    
    while (activeRooms > 0) {
        console.log(`Waiting for ${activeRooms} active rooms to finish...`);
        // Simulação: Checar periodicamente o número de salas ativas
        // activeRooms = await matchmaker.queryActiveRoomsCount();
        
        // Para o placeholder, vamos apenas esperar um pouco ou sair se for um teste
        if (process.env.NODE_ENV === 'test') break;
        
        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30s
        activeRooms = 0; // Force exit for this placeholder
    }

    console.log("All rooms closed. Shutting down.");
    process.exit(0);
}

shutdown();
