"use client"

import ProductDetails from '@/app/productspage/[id]/page'
import React, { useState } from 'react'


const search=[
    {product:'rice'},
    {product:'beans'},
    {product:'fufu'},
    {product:'soup'},
    {product:'amala'}
]

function page() {
    const [searches,setsearchs]=useState('')
 const filtersearch=search.filter((search)=>search.product.includes(searches.toLowerCase()))
  return (
    <div className=''>
       <div className="flex w-70">
        <h2>search for values</h2>
        <input type="text" value={searches} onChange={(e) =>{setsearchs(e.target.value); console.log(e.target.value)}  } placeholder='search  product' />
        <div className="">
            <ul>
             {
                filtersearch.map((e, index)=>{
                    return(
                        <li key={index}>{e.product}</li>
                    )
                })
             }
            </ul>
        </div>
       </div>
    </div>
  )
}

export default page
