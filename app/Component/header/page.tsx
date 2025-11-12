 'use client'

import Link from 'next/link'
import Image from 'next/image'
import React, { useState } from 'react'
import { FiSearch } from "react-icons/fi"
import Search from '@/app/Component/Search/searchitem'
import { useCart } from '../ContextCart/page'
import { useAuth } from '@/app/ContextAuth/Authcontext'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { GiHamburgerMenu } from "react-icons/gi"
import { LiaTimesSolid } from "react-icons/lia"
import { useRouter } from 'next/navigation'

const item_navbar = [
  { name: 'home', path: '/new-features' },
  { name: 'product', path: '/men' },
  { name: 'service', path: '/women' },
  { name: 'signup', path: '/kids' }
]

function Navbar() {
  const [showslidesearch, setshowslidesearch] = useState(false)
  const [showNavbar, setshowNavbar] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { state: { items } } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  
  const showslidenav = () => {
    setshowNavbar(!showNavbar)
  }

  const closeNav = () => {
    setshowNavbar(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setShowUserMenu(false)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
   
  return (
    <nav className='sticky top-0 z-50 bg-white border-b border-gray-200'>
      <div className='flex w-full px-4 sm:px-6 md:px-8 lg:px-14 h-[60px] md:h-[70px] gap-2 sm:gap-4 md:gap-9 items-center justify-between'>
        {/* Logo */}
        <div className='flex-shrink-0'> 
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/mog.png"
              alt="Mogshop Logo"
              width={64}
              height={64}
              className="h-10 sm:h-14 md:h-16 w-auto"
              unoptimized
            />
            <h1 className='text-base sm:text-lg md:text-xl font-bold'>
              Mogshop
            </h1>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <div className='hidden lg:flex'>
          <ul className='flex gap-1 items-center'> 
            {item_navbar.map((item, id) =>
              item.path ? (
                <li key={id}>
                  <Link 
                    href={item.path} 
                    className='px-4 py-2 capitalize text-sm font-medium relative inline-block hover:text-gray-600 transition-colors
                    before:absolute before:content-[""] before:w-full before:scale-0 before:hover:scale-100 
                    before:transition-transform before:duration-300 before:h-[2px] before:bottom-0 before:left-0 before:bg-black'
                  >
                    {item.name}
                  </Link>
                </li>
              ) : (
                <li key={id}>
                  <span className='px-4 py-2 text-gray-400 cursor-default text-sm'>{item.name}</span>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Search Button */}
          <button
            onClick={() => setshowslidesearch(true)} 
            className="hidden md:flex cursor-pointer group items-center rounded-full px-3 gap-2 bg-[#f5f5f5] hover:bg-[#e5e5e5] h-[40px] transition-colors"
            aria-label="Search"
          >
            <div className='flex items-center justify-center w-[24px] h-[24px]'>
              <FiSearch size={20} />
            </div>
            <span className='text-sm hidden lg:block'>Search</span>
          </button>

          {/* Mobile Search Icon */}
          <button
            onClick={() => setshowslidesearch(true)} 
            className="flex md:hidden p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
            aria-label="Search"
          >
            <FiSearch size={20} />
          </button>

          {/* Favourites */}
          <Link 
            className='hidden sm:flex hover:bg-[#f5f5f5] rounded-full p-2 transition-colors' 
            href="/Component/Demosearch" 
            title="Favourites"
            aria-label="Favourites"
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
              <path stroke="currentColor" strokeWidth="1.5" d="M16.794 3.75c1.324 0 2.568.516 3.504 1.451a4.96 4.96 0 010 7.008L12 20.508l-8.299-8.299a4.96 4.96 0 010-7.007A4.923 4.923 0 017.205 3.75c1.324 0 2.568.516 3.504 1.451l.76.76.531.531.53-.531.76-.76a4.926 4.926 0 013.504-1.451"></path>
            </svg>
          </Link>

          {/* Cart */}
          <Link 
            className="hover:bg-[#f5f5f5] rounded-full p-2 flex items-center transition-colors relative" 
            href="/Component/cartpage" 
            title={`Bag Items: ${items.length}`}
            aria-label={`Shopping bag with ${items.length} items`}
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
              <path stroke="currentColor" strokeWidth="1.5" d="M8.25 8.25V6a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 110 4.5H3.75v8.25a3.75 3.75 0 003.75 3.75h9a3.75 3.75 0 003.75-3.75V8.25H17.5" />
            </svg>
            {items.length > 0 && (
              <>
                <span className="hidden sm:inline ml-2 text-sm font-medium">({items.length})</span>
                <span className="sm:hidden absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {items.length}
                </span>
              </>
            )}
          </Link>

          {/* User Profile or Sign-in */}
          {user ? (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-[#f5f5f5] rounded-full p-1 transition-colors"
                aria-label="User menu"
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    width={36}
                    height={36}
                    className="rounded-full border-2 border-gray-200"
                    unoptimized
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{user.displayName || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/order"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📦 My Orders
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      👤 Profile
                    </Link>
                    <Link
                      href="/Component/Demosearch"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      ❤️ Favourites
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link 
              href="/signin" 
              className="hidden sm:flex px-3 py-2 rounded-full bg-black text-white text-sm hover:opacity-90 transition-opacity whitespace-nowrap" 
              title="Sign in"
            >
              Sign in
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            onClick={showslidenav} 
            className="flex lg:hidden cursor-pointer hover:bg-[#f5f5f5] items-center justify-center rounded-full w-[40px] h-[40px] transition-colors ml-1"
            aria-label="Toggle menu"
            type="button"
          >
            <GiHamburgerMenu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {showNavbar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-in Menu */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-white shadow-2xl
          transform transition-transform duration-300 ease-in-out z-50
          ${showNavbar ? 'translate-x-0' : 'translate-x-full'}
          lg:hidden
        `}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button 
            onClick={closeNav} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <LiaTimesSolid size={24} />
          </button>
        </div>

        {/* User Profile Section (Mobile) */}
        {user && (
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  width={48}
                  height={48}
                  className="rounded-full border-2 border-gray-200"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Nav Links */}
        <ul className='flex flex-col p-4'> 
          {user && (
            <>
              <li className="border-b border-gray-100">
                <Link 
                  href="/order" 
                  className='block px-4 py-4 text-base font-medium hover:bg-gray-50 rounded-lg transition-colors'
                  onClick={closeNav}
                >
                  📦 My Orders
                </Link>
              </li>
              <li className="border-b border-gray-100">
                <Link 
                  href="/profile" 
                  className='block px-4 py-4 text-base font-medium hover:bg-gray-50 rounded-lg transition-colors'
                  onClick={closeNav}
                >
                  👤 Profile
                </Link>
              </li>
            </>
          )}
          {item_navbar.map((item, id) =>
            item.path ? (
              <li key={id} className="border-b border-gray-100">
                <Link 
                  href={item.path} 
                  className='block px-4 py-4 capitalize text-base font-medium hover:bg-gray-50 rounded-lg transition-colors'
                  onClick={closeNav}
                >
                  {item.name}
                </Link>
              </li>
            ) : (
              <li key={id} className="border-b border-gray-100">
                <span className='block px-4 py-4 text-gray-400 cursor-default text-base'>{item.name}</span>
              </li>
            )
          )}
        </ul>

        {/* Mobile Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-3">
          <Link 
            href="/Component/Demosearch" 
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={closeNav}
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
              <path stroke="currentColor" strokeWidth="1.5" d="M16.794 3.75c1.324 0 2.568.516 3.504 1.451a4.96 4.96 0 010 7.008L12 20.508l-8.299-8.299a4.96 4.96 0 010-7.007A4.923 4.923 0 017.205 3.75c1.324 0 2.568.516 3.504 1.451l.76.76.531.531.53-.531.76-.76a4.926 4.926 0 013.504-1.451"></path>
            </svg>
            <span className="text-base font-medium">Favourites</span>
          </Link>
          
          {user ? (
            <button 
              onClick={() => {
                handleSignOut()
                closeNav()
              }}
              className="block w-full px-4 py-3 text-center rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link 
              href="/signin" 
              className="block w-full px-4 py-3 text-center rounded-full bg-black text-white font-medium hover:opacity-90 transition-opacity"
              onClick={closeNav}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Slide-in Search */}
      <Search isOpen={showslidesearch} isClose={() => setshowslidesearch(false)} />
    </nav>
  )
}

export default Navbar