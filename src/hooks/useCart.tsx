import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInCard = cart.find(product => product.id === productId);
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (productInCard) {
        if (stock.amount > productInCard.amount) {
          const updatedCart = cart.map(product => product.id === productId
            ? {
              ...product,
              amount: product.amount + 1
            }
            : product
          )

          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

        } else toast.error('Quantidade solicitada fora de estoque');
      } else {

        const { data: product } = await api.get<Product>(`/products/${productId}`);

        if (stock.amount > 0) {
          setCart([...cart, { ...product, amount: 1 }]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(
            [...cart, { ...product, amount: 1 }]
          ));

          return;
        }
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const quantityProductInCard = cart.find(product => product.id === productId)?.amount;

      if (quantityProductInCard) {
        const updatedCart = cart.filter(product => product.id !== productId);
        setCart(updatedCart)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (stock.amount >= amount) {
        const updatedCart = cart.map(product => product.id === productId
          ? {
            ...product,
            amount: amount
          }
          : product
        )
        setCart(updatedCart)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));

      } else toast.error('Quantidade solicitada fora de estoque');

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
