"use client";

import Link from "next/link";

const sidebarItems = [
  {
    title: "dashboard",
    href: "/",
  },
  {
    title: "prompt",
    href: "/prompt",
  },
  
];

const SideBarMenu = ()=>{
    {
        sidebarItems.map((item)=>(
          <Link href={item.href} key={item.title} className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 p-2 md:px-2 rounded-sm hover:bg-skyLight">
                <span className="hidden lg:block ">{item.title}</span>
              </Link>
        ))
    }
}

export default SideBarMenu;