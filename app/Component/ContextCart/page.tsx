 
"use client"
import React, { createContext, useContext, useReducer } from 'react';

// Define the shape of the cart item
interface CartItem {
    images: string | undefined;
    id: number;
    name: string;
    price: number;
    quantity: number;
}

// Define the shape of the cart state
interface CartState {
    items: CartItem[];
}

// Define the actions for the cart reducer
type CartAction =
    | { type: 'ADD_ITEM'; item: CartItem }
    | { type: 'REMOVE_ITEM'; id: number }
    | { type: 'CLEAR_CART' };

// Create a context for the cart
const CartContext = createContext<{
    state: CartState;
    dispatch: React.Dispatch<CartAction>;
} | undefined>(undefined);

// Define the initial state of the cart
const initialState: CartState = {
    items: [],
};

// Create a reducer to manage the cart state
function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'ADD_ITEM':
            return {
                ...state,
                items: [...state.items, action.item],
            };
        case 'REMOVE_ITEM':
            return {
                ...state,
                items: state.items.filter(item => item.id !== action.id),
            };
        case 'CLEAR_CART':
            return initialState;
        default:
            throw new Error(`Unhandled action type: ${(action as CartAction).type}`);
    }
}

// Create a provider component for the cart context
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    return (
        <CartContext.Provider value={{ state, dispatch }}>
            {children}
        </CartContext.Provider>
    );
};

// Create a custom hook to use the cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

// Example of a component that uses the cart context
const Cart: React.FC = () => {
    const { state, dispatch } = useCart();

    return (
        <div>
            <h2>Shopping Cart</h2>
            <ul>
                {state.items.map(item =>(
                    <li key={item.id}>
                        {item.name} - ${item.price} x {item.quantity}
                        <button onClick={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}>
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
            <button onClick={ () => dispatch({ type: 'CLEAR_CART' })}>Clear Cart</button>
        </div>
    );
};

export default Cart;