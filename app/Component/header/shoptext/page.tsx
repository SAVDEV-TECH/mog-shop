
"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { FaAngleRight } from "react-icons/fa6";
import { FaAngleLeft } from "react-icons/fa6";


function page() {
  const [Slider, setSlider]=useState(0)
  const moveleft=()=>{
    setSlider((prev)=> (prev + 1 ) % slides.length)
  }
  const moveright=()=>{
    setSlider((prev)=> (prev - 1  + slides.length) % slides.length)
  }
  const slides=[
    "shop all arrival",
    "shop recent arrival",
    "shop 2 weeks arrival",
    "shop 1 month arrival",
  ]
  return (
    <div className=' relative flex  items-center bg-[#e5e5e5] justify-center w-full py-6'>
      <FaAngleLeft className='absolute cursor-pointer left-[30%]' onClick={moveright} />
      <div className="w-[400px] overflow-hidden  mx-auto">
        

        <div className="w-[1600px] text-center transition-[600]  flex">
        
    
    <li className='w-[400px] text-[14px] list-none transition-[600] text-center' >
    {
      slides[Slider]
     }
    </li>
            
        
        </div>
      
      </div>
      <FaAngleRight className='absolute cursor-pointer right-[30%]' onClick={moveleft} />
      {/* <h1 className='text-[16px]'>SHOP ALL NEW ARRIVALS  <Link  href=''>shop</Link></h1> */}
    </div>
  )
}

export default page
