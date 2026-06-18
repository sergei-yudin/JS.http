const Koa = require('koa');
const koaBody = require('koa-body');
const { v4: uuidv4 } = require('uuid');

const app = new Koa();

const tickets = [];

app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type');

    if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
        return;
    }

    await next();
});

app.use(koaBody({
    json: true,
    urlencoded: true,
    multipart: true,
}));

app.use(async (ctx) => {
    const { method, id } = ctx.query;

    if (method === 'allTickets' && ctx.request.method === 'GET') {
        ctx.body = tickets.map((ticket) => ({
            id: ticket.id,
            name: ticket.name,
            status: ticket.status,
            created: ticket.created,
        }));
        return;
    }

    if (method === 'ticketById' && ctx.request.method === 'GET') {
        const ticket = tickets.find((item) => item.id === id);

        if (!ticket) {
            ctx.status = 404;
            ctx.body = { error: 'Ticket not found' };
            return;
        }

        ctx.body = ticket;
        return;
    }

    if (method === 'createTicket' && ctx.request.method === 'POST') {
        const { name, description, status } = ctx.request.body;

        const ticket = {
            id: uuidv4(),
            name,
            description,
            status: Boolean(status),
            created: Date.now(),
        };

        tickets.push(ticket);
        ctx.status = 201;
        ctx.body = ticket;
        return;
    }

    if (method === 'updateById' && ctx.request.method === 'POST') {
        const ticket = tickets.find((item) => item.id === id);

        if (!ticket) {
            ctx.status = 404;
            ctx.body = { error: 'Ticket not found' };
            return;
        }

        const { name, description, status } = ctx.request.body;

        if (name !== undefined) {
            ticket.name = name;
        }

        if (description !== undefined) {
            ticket.description = description;
        }

        if (status !== undefined) {
            ticket.status = Boolean(status);
        }

        ctx.body = ticket;
        return;
    }

    if (method === 'deleteById' && ctx.request.method === 'GET') {
        const ticketIndex = tickets.findIndex((item) => item.id === id);

        if (ticketIndex === -1) {
            ctx.status = 404;
            ctx.body = { error: 'Ticket not found' };
            return;
        }

        tickets.splice(ticketIndex, 1);
        ctx.status = 204;
        return;
    }

    ctx.status = 404;
    ctx.body = { error: 'Unknown method' };
});

const port = process.env.PORT || 7070;

app.listen(port, () => {
    console.log(`server is listening on ${port}`);
});
