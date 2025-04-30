 
 'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import { FiSearch } from "react-icons/fi"
import Search from '@/app/Component/Search/searchitem'
import { useCart } from '../ContextCart/page'
import { GiHamburgerMenu } from "react-icons/gi";
import { LiaTimesSolid } from "react-icons/lia";

const item_navbar = [
  { name: 'New features', path: '/new-features' },
  { name: 'Men', path: '/men' },
  { name: 'Women', path: '/women' },
  { name: 'Kids', path: '/kids' }
]

function Navbar() {
  const [showslidesearch, setshowslidesearch] = useState(false)
  const [showNavbar, setshowNavbar] = useState(false)
  const { state: { items } } = useCart()
   const showslidenav=()=>{
    setshowNavbar(!showNavbar)
   }
  //  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
   
  return (
    <div className='flex w-full px-14 h-[50px]    gap-9 items-center justify-between'>
      {/* Logo or icon */}
      <div className=''> 
        <svg aria-hidden="true" viewBox="0 0 24 24" role="img" width="74px" height="74px" fill="none">
          <path fill="currentColor" fillRule="evenodd" d="M21 8.719L7.836 14.303C6.74 14.768 5.818 15 5.075 15c-.836 0-1.445-.295-1.819-.884-.485-.76-.273-1.982.559-3.272.494-.754 1.122-1.446 1.734-2.108-.144.234-1.415 2.349-.025 3.345.275.2.666.298 1.147.298.386 0 .829-.063 1.316-.19L21 8.719z" clipRule="evenodd"></path>
        </svg>
      </div>

      {/* Nav Links */}
       
      <div
  className={`
    ${showNavbar ? 'translate-x-0' : 'translate-x-full'} 
    fixed md:static 
    md:translate-x-[100px]
    top-0 right-0 h-screen md:h-auto 
    w-[300px] md:w-max 
    flex flex-col md:flex-row 
    items-center md:justify-between 
    bg-white 
    transition-transform duration-300 ease-in-out 
    z-20
  `}
>


      <div onClick={()=>setshowNavbar(false)}  className="p-4 md:hidden flex cursor-pointer bg-white">
        <LiaTimesSolid size={20}></LiaTimesSolid>
      </div>
    <ul className='flex w-[300px] gap-3  md:w-max    md:flex-row flex-col'> 
        {item_navbar.map((item, id) =>
          item.path ? (
            <li key={id}>
              <Link href={item.path} className='mx-2 pl-6 py-4 relative inline-block before:absolute before:content-[""] before:w-full before:scale-0 before:hover:scale-100 before:transition-transform before:h-[2px] before:-bottom-1 before:bg-black'>
                {item.name}
              </Link>
            </li>
          ) : (
            <li key={id}>
              <span className='mx-2 flex flex-col text-gray-500 cursor-default'>{item.name}</span>
            </li>
          )
        )}
        </ul>
      </div>
      {
        showNavbar &&(
          <div className=" absolute inset-0 h-[100vh] z-10 bg-[#0000005e]  "></div>
        )
      }

      {/* Right Icons */}
      <div className="flex items-center ml-auto gap-3">
        {/* Search Button */}
        <div onClick={() => setshowslidesearch(true)} className="hidden md:flex cursor-pointer group items-center rounded-full py-3 gap-2 w-[140px] bg-[#e5e5e5] h-[35px]">
          <button aria-label="Search" className='group-hover:bg-slate-500 rounded-full ml-[1px] flex items-center justify-center w-[33px] h-[33px]' type="button" id="nav-search-icon">
            <FiSearch size={20} />
          </button>
          <p>Search</p>
        </div>
        <div onClick={() => setshowslidesearch(true)} className="flex md:hidden cursor-pointer">
          <FiSearch size={20} />
        </div>

        {/* Favourites */}
        <Link className='hover:bg-[#e5e5e5] rounded-full p-2' href="/Component/Demosearch" title="Favourites">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
            <path stroke="currentColor" strokeWidth="1.5" d="M16.794 3.75c1.324 0 2.568.516 3.504 1.451a4.96 4.96 0 010 7.008L12 20.508l-8.299-8.299a4.96 4.96 0 010-7.007A4.923 4.923 0 017.205 3.75c1.324 0 2.568.516 3.504 1.451l.76.76.531.531.53-.531.76-.76a4.926 4.926 0 013.504-1.451"></path>
          </svg>
        </Link>

        {/* Cart */}
        <Link className="hover:bg-[#e5e5e5] rounded-full p-2 flex items-center" href="/Component/cartpage" title={`Bag Items: ${items.length}`}>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
            <path stroke="currentColor" strokeWidth="1.5" d="M8.25 8.25V6a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 110 4.5H3.75v8.25a3.75 3.75 0 003.75 3.75h9a3.75 3.75 0 003.75-3.75V8.25H17.5" />
          </svg>
          {items.length > 0 && <span className="ml-2 text-sm font-medium">Bag {items.length}</span>}
        </Link>
      </div>
      <div onClick={showslidenav} className="cursor-pointer hover:bg-[#e5e5e5]  items-center justify-center rounded-full w-[40px] h-[40px] transition-all flex md:hidden">
      <GiHamburgerMenu size={20}></GiHamburgerMenu>
      </div>
 
      {/* Slide-in Search */}
      <Search isOpen={showslidesearch} isClose={() => setshowslidesearch(false)} />
    </div>
  )
}

export default Navbar

