if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const paypal = require('paypal-rest-sdk');
const PORT = process.env.PORT || 3000;

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET
});

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('index'));

app.post('/pay', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red Sox Hat",
                    "sku": "001",
                    "price": "25.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "25.00"
            },
            "description": "Just a hat!!!"
        }]
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
        if (error) {
            throw error;
        } else {
            payment.links.forEach(link => {
                if (link.rel === 'approval_url') {
                    res.redirect(link.href);
                }
            });
        }
    });
});

app.get('/success', (req, res) => {
    const { PayerID, paymentId } = req.query;
    const execute_payment_json = {
        "payer_id": PayerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "25.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.send('Success');
        }
    });
});

app.get('/cancel', (req, res) => res.send('canelled'));

app.listen(PORT, () => console.log('Listening... http://localhost:3000'));