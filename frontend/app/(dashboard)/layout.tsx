
import Link from "next/link";
import SideBarMenu from '../../components/sidebarMenu';
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen felx">
        <div className="w-[14%] md:[8%] lg:w[16%] xl:w[14%] p-4">
            <Link href={'/'} className="flex items-center justify-center lg:justify-start gap-2">
            <span className="hidden lg:block text-gray-700 font-semibold  text-xl">GEO Tracker</span>
            </Link>
            <SideBarMenu/>
        </div>
    </div>
  );
}
