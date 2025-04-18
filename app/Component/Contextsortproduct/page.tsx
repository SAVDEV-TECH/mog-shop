'use client'

import React,{Children, createContext, ReactNode, useContext, useState, Key} from "react"

// Define the product type
interface product {
    title: string;
    price: number;
    rating: ReactNode;
    beauty: ReactNode;
    images: (images: any) => unknown;
    id: Key | null | undefined;
}


// interface ProductContextProps{
//     sortedProduct: product[];
//     setsortedproduct:React.Dispatch<React.SetStateAction<product[]>>;
// }
export interface ProductContextProps {
    // Add existing properties here
    sortedproduct: {
      rating: ReactNode;
      beauty: ReactNode;
      images: (images: any) => unknown;
      id: Key | null | undefined; title: string; price: number 
}[]; // Adjust the type as per your data structure
    setsortedproduct: React.Dispatch<React.SetStateAction<product[]>>;
  }
   

const productContext=createContext<ProductContextProps  | undefined>(undefined)

export const ProductProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [sortedproduct,setsortedproduct]=useState<product[]>([])
    return (
        <productContext.Provider value={{sortedproduct,setsortedproduct}}>
            {children}
        </productContext.Provider>
    )
}

export const useProductContext = () => {
    const context = useContext(productContext);
    if (!context) {
      throw new Error("useProductContext must be used within a ProductProvider");
    }
    return context;
  };