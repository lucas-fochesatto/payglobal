import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";

// This is your test secret API key.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.WEBHOOK_SECRET;

export const config = {
    api: {
        bodyParser: false,
    },
};

async function buffer(readable: Readable) {
    const chunks = [];

    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req : NextApiRequest, res : NextApiResponse) {
    let event;

    const buf = await buffer(req);
    const rawBody = buf.toString('utf8');

    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'];
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            endpointSecret
        );
    } catch (err : any) {
        console.log(err.message)
        res.status(400).end();
        return
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log(paymentIntent);
            break;
        default:
            break;
    }

    res.json({ received: true })
}