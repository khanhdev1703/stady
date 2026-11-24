const clients = new Map();

const writeEvent = (res, event, data) => {
    if (res.writableEnded) {
        return false;
    }

    try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);

        return true;
    } catch {
        return false;
    }
};

const addClient = (userId, res) => {
    const userClients = clients.get(userId) || new Set();

    userClients.add(res);
    clients.set(userId, userClients);

    return () => {
        userClients.delete(res);

        if (userClients.size === 0) {
            clients.delete(userId);
        }
    };
};

const emitNotification = (userId, notification) => {
    const userClients = clients.get(userId);

    if (!userClients) {
        return;
    }

    for (const res of userClients) {
        if (!writeEvent(res, "notification", { notification })) {
            userClients.delete(res);
            res.end();
        }
    }

    if (userClients.size === 0) {
        clients.delete(userId);
    }
};

export { addClient, emitNotification };
