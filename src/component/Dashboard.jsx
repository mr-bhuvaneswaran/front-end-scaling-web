import React from 'react';
import '../App.css';
import socketIoClient from 'socket.io-client';

const ENDPOINT = process.env.REACT_APP_SERVICE_URI;

class Dashboard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {products: [], user: {}, productMap: {}};
    }

    componentDidMount() {
        this.fetchUser()
        const socket = socketIoClient(ENDPOINT);
        socket.on("Order_Delivered", data => {
            alert('Order Delivered');
        });

    }

    fetchUser = () => {
        const userPromise = fetch('/user');
        userPromise.then(response => response.json()).then(data => {
            this.setState({user: data.data});
            this.fetchProducts();
        }).catch(console.error());
    }

    fetchProducts = () => {
        const productPromise = fetch('/products');
        productPromise.then(response => response.json()).then(data => {
            let products = data.data;
            let productMap = {};
            products.forEach(item => { productMap[item._id] = this.getQuantityInCart(item._id)});
            this.setState({products, productMap });
        }).catch(console.error());    
    }

    addProductToCart = (id) => {
        let productMap = this.state.productMap;
        productMap[id]++;
        this.setState({productMap});
        let user = this.state.user;
        let cart = [];
        if(user && user['cart'] && user['cart']['items']) {
            cart = user['cart']['items'];
        } 
        let cartItem = cart.find(item => item.product === id);
        if(cartItem) {
            cartItem['quantity']++;
        } else {
            cart.push({product: id, quantity : 1});
        }
        user.cart = { ...user.cart, items: cart };
        this.setState({user});
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                "cartId": user['cart']['_id'],
                "cartData": cart
            })
        }
        const cartPromise = fetch('/cart', options);
        cartPromise.then(response => response.json()).then(data => {}).catch(console.error());   
    }

    getQuantityInCart(productId) {
        let user = this.state.user;
        let cart = [];
        if(user && user['cart'] && user['cart']['items']) {
            cart = user['cart']['items'];
        } 
        let cartItem = cart.find(item => item.product === productId);
        return cartItem ? cartItem.quantity : 0; 
    }

    placeOrder = () => {
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                "userId": this.state.user['_id'],
            })
        }
        const cartPromise = fetch('/order', options);
        cartPromise.then(response => response.json()).then(data => {
            this.fetchUser();
        }).catch(console.error());   
    }

    render() {
        const productList = this.state.products.map(item => {
            return (
                <div className="product" key={item._id}>
                    <div className="title"> {item.name} </div>
                    <div>
                        <button className="button" onClick={() => this.addProductToCart(item._id)}>Add</button>
                        <span>{this.state.productMap[item._id]}</span>
                    </div>
                </div>
            )
        })
        return (
            <section>
                <div className="place-order">
                    <button className="button order-button" onClick={this.placeOrder}>Place Order</button>
                </div>
                <div>
                    {productList}
                </div>
                
            </section>
        )
    }
}

export default Dashboard;