"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const outline_1 = require("@heroicons/react/24/outline");
const navigation = [
    { name: 'Dashboard', href: '/', icon: outline_1.HomeIcon },
    { name: 'Inventory', href: '/inventory', icon: outline_1.CubeIcon },
    { name: 'Recommendations', href: '/recommendations', icon: outline_1.LightBulbIcon },
    { name: 'Analytics', href: '/analytics', icon: outline_1.ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: outline_1.CogIcon },
];
const Layout = ({ children, user, signOut }) => {
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(false);
    const location = (0, react_router_dom_1.useLocation)();
    const getUserRole = (user) => {
        // Extract role from user attributes or groups
        const groups = user?.signInUserSession?.accessToken?.payload?.['cognito:groups'] || [];
        if (groups.includes('admin'))
            return 'Administrator';
        if (groups.includes('manager'))
            return 'Warehouse Manager';
        if (groups.includes('procurement'))
            return 'Procurement Specialist';
        return 'User';
    };
    return (<div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}/>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setSidebarOpen(false)}>
              <outline_1.XMarkIcon className="h-6 w-6 text-white"/>
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">Inventory AI</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (<react_router_dom_1.Link key={item.name} to={item.href} className={`${isActive
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-base font-medium rounded-md`} onClick={() => setSidebarOpen(false)}>
                    <item.icon className="mr-4 h-6 w-6"/>
                    {item.name}
                  </react_router_dom_1.Link>);
        })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">Inventory AI</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (<react_router_dom_1.Link key={item.name} to={item.href} className={`${isActive
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}>
                      <item.icon className="mr-3 h-6 w-6"/>
                      {item.name}
                    </react_router_dom_1.Link>);
        })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden" onClick={() => setSidebarOpen(true)}>
            <outline_1.Bars3Icon className="h-6 w-6"/>
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="flex items-center h-16">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  <div className="font-medium">{user?.attributes?.email}</div>
                  <div className="text-xs text-gray-500">{getUserRole(user)}</div>
                </div>
                <button onClick={signOut} className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <outline_1.ArrowRightOnRectangleIcon className="h-6 w-6"/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>);
};
exports.default = Layout;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGF5b3V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTGF5b3V0LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQXdDO0FBQ3hDLHVEQUFxRDtBQUNyRCx5REFTcUM7QUFRckMsTUFBTSxVQUFVLEdBQUc7SUFDakIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGtCQUFRLEVBQUU7SUFDaEQsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLGtCQUFRLEVBQUU7SUFDekQsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSx1QkFBYSxFQUFFO0lBQzFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxzQkFBWSxFQUFFO0lBQzdELEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxpQkFBTyxFQUFFO0NBQ3ZELENBQUM7QUFFRixNQUFNLE1BQU0sR0FBMEIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtJQUNwRSxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBQyxLQUFLLENBQUMsQ0FBQztJQUN0RCxNQUFNLFFBQVEsR0FBRyxJQUFBLDhCQUFXLEdBQUUsQ0FBQztJQUUvQixNQUFNLFdBQVcsR0FBRyxDQUFDLElBQVMsRUFBVSxFQUFFO1FBQ3hDLDhDQUE4QztRQUM5QyxNQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3ZGLElBQUks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QUFDLE1BQU0sQ0FDTCxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FDakIsU0FBUyxDQUFDLHdJQUF3SSxDQUVsSjtrQkFBQSxDQUFDLG1DQUF5QixDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQ2hEO2dCQUFBLEVBQUUsTUFBTSxDQUNWO2NBQUEsRUFBRSxHQUFHLENBQ1A7WUFBQSxFQUFFLEdBQUcsQ0FDUDtVQUFBLEVBQUUsR0FBRyxDQUNQO1FBQUEsRUFBRSxHQUFHLENBRUw7O1FBQUEsQ0FBQyxrQkFBa0IsQ0FDbkI7UUFBQSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsb0RBQW9ELENBQ2xFO1VBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FDbkI7WUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsd0NBQXdDLENBQ3JEO2NBQUEsQ0FBQyxRQUFRLENBQ1g7WUFBQSxFQUFFLEdBQUcsQ0FDUDtVQUFBLEVBQUUsR0FBRyxDQUNQO1FBQUEsRUFBRSxJQUFJLENBQ1I7TUFBQSxFQUFFLEdBQUcsQ0FDUDtJQUFBLEVBQUUsR0FBRyxDQUFDLENBQ1AsQ0FBQztBQUNKLENBQUMsQ0FBQztBQUVGLGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgTGluaywgdXNlTG9jYXRpb24gfSBmcm9tICdyZWFjdC1yb3V0ZXItZG9tJztcclxuaW1wb3J0IHtcclxuICBIb21lSWNvbixcclxuICBDdWJlSWNvbixcclxuICBMaWdodEJ1bGJJY29uLFxyXG4gIENoYXJ0QmFySWNvbixcclxuICBDb2dJY29uLFxyXG4gIEJhcnMzSWNvbixcclxuICBYTWFya0ljb24sXHJcbiAgQXJyb3dSaWdodE9uUmVjdGFuZ2xlSWNvbixcclxufSBmcm9tICdAaGVyb2ljb25zL3JlYWN0LzI0L291dGxpbmUnO1xyXG5cclxuaW50ZXJmYWNlIExheW91dFByb3BzIHtcclxuICBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlO1xyXG4gIHVzZXI6IGFueTtcclxuICBzaWduT3V0PzogKCkgPT4gdm9pZDtcclxufVxyXG5cclxuY29uc3QgbmF2aWdhdGlvbiA9IFtcclxuICB7IG5hbWU6ICdEYXNoYm9hcmQnLCBocmVmOiAnLycsIGljb246IEhvbWVJY29uIH0sXHJcbiAgeyBuYW1lOiAnSW52ZW50b3J5JywgaHJlZjogJy9pbnZlbnRvcnknLCBpY29uOiBDdWJlSWNvbiB9LFxyXG4gIHsgbmFtZTogJ1JlY29tbWVuZGF0aW9ucycsIGhyZWY6ICcvcmVjb21tZW5kYXRpb25zJywgaWNvbjogTGlnaHRCdWxiSWNvbiB9LFxyXG4gIHsgbmFtZTogJ0FuYWx5dGljcycsIGhyZWY6ICcvYW5hbHl0aWNzJywgaWNvbjogQ2hhcnRCYXJJY29uIH0sXHJcbiAgeyBuYW1lOiAnU2V0dGluZ3MnLCBocmVmOiAnL3NldHRpbmdzJywgaWNvbjogQ29nSWNvbiB9LFxyXG5dO1xyXG5cclxuY29uc3QgTGF5b3V0OiBSZWFjdC5GQzxMYXlvdXRQcm9wcz4gPSAoeyBjaGlsZHJlbiwgdXNlciwgc2lnbk91dCB9KSA9PiB7XHJcbiAgY29uc3QgW3NpZGViYXJPcGVuLCBzZXRTaWRlYmFyT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XHJcbiAgY29uc3QgbG9jYXRpb24gPSB1c2VMb2NhdGlvbigpO1xyXG5cclxuICBjb25zdCBnZXRVc2VyUm9sZSA9ICh1c2VyOiBhbnkpOiBzdHJpbmcgPT4ge1xyXG4gICAgLy8gRXh0cmFjdCByb2xlIGZyb20gdXNlciBhdHRyaWJ1dGVzIG9yIGdyb3Vwc1xyXG4gICAgY29uc3QgZ3JvdXBzID0gdXNlcj8uc2lnbkluVXNlclNlc3Npb24/LmFjY2Vzc1Rva2VuPy5wYXlsb2FkPy5bJ2NvZ25pdG86Z3JvdXBzJ10gfHwgW107XHJcbiAgICBpZiAoZ3JvdXBzLmluY2x1ZGVzKCdhZG1pbicpKSByZXR1cm4gJ0FkbWluaXN0cmF0b3InO1xyXG4gICAgaWYgKGdyb3Vwcy5pbmNsdWRlcygnbWFuYWdlcicpKSByZXR1cm4gJ1dhcmVob3VzZSBNYW5hZ2VyJztcclxuICAgIGlmIChncm91cHMuaW5jbHVkZXMoJ3Byb2N1cmVtZW50JykpIHJldHVybiAnUHJvY3VyZW1lbnQgU3BlY2lhbGlzdCc7XHJcbiAgICByZXR1cm4gJ1VzZXInO1xyXG4gIH07XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImgtc2NyZWVuIGZsZXggb3ZlcmZsb3ctaGlkZGVuIGJnLWdyYXktMTAwXCI+XHJcbiAgICAgIHsvKiBNb2JpbGUgc2lkZWJhciAqL31cclxuICAgICAgPGRpdiBjbGFzc05hbWU9e2BmaXhlZCBpbnNldC0wIGZsZXggei00MCBtZDpoaWRkZW4gJHtzaWRlYmFyT3BlbiA/ICcnIDogJ2hpZGRlbid9YH0+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaXhlZCBpbnNldC0wIGJnLWdyYXktNjAwIGJnLW9wYWNpdHktNzVcIiBvbkNsaWNrPXsoKSA9PiBzZXRTaWRlYmFyT3BlbihmYWxzZSl9IC8+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBmbGV4LTEgZmxleCBmbGV4LWNvbCBtYXgtdy14cyB3LWZ1bGwgYmctd2hpdGVcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTAgcmlnaHQtMCAtbXItMTIgcHQtMlwiPlxyXG4gICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibWwtMSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBoLTEwIHctMTAgcm91bmRlZC1mdWxsIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbnNldCBmb2N1czpyaW5nLXdoaXRlXCJcclxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaWRlYmFyT3BlbihmYWxzZSl9XHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICA8WE1hcmtJY29uIGNsYXNzTmFtZT1cImgtNiB3LTYgdGV4dC13aGl0ZVwiIC8+XHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBoLTAgcHQtNSBwYi00IG92ZXJmbG93LXktYXV0b1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtc2hyaW5rLTAgZmxleCBpdGVtcy1jZW50ZXIgcHgtNFwiPlxyXG4gICAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LWdyYXktOTAwXCI+SW52ZW50b3J5IEFJPC9oMT5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxuYXYgY2xhc3NOYW1lPVwibXQtNSBweC0yIHNwYWNlLXktMVwiPlxyXG4gICAgICAgICAgICAgIHtuYXZpZ2F0aW9uLm1hcCgoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXNBY3RpdmUgPSBsb2NhdGlvbi5wYXRobmFtZSA9PT0gaXRlbS5ocmVmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgPExpbmtcclxuICAgICAgICAgICAgICAgICAgICBrZXk9e2l0ZW0ubmFtZX1cclxuICAgICAgICAgICAgICAgICAgICB0bz17aXRlbS5ocmVmfVxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YCR7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpc0FjdGl2ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1wcmltYXJ5LTEwMCB0ZXh0LXByaW1hcnktOTAwJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICd0ZXh0LWdyYXktNjAwIGhvdmVyOmJnLWdyYXktNTAgaG92ZXI6dGV4dC1ncmF5LTkwMCdcclxuICAgICAgICAgICAgICAgICAgICB9IGdyb3VwIGZsZXggaXRlbXMtY2VudGVyIHB4LTIgcHktMiB0ZXh0LWJhc2UgZm9udC1tZWRpdW0gcm91bmRlZC1tZGB9XHJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2lkZWJhck9wZW4oZmFsc2UpfVxyXG4gICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgPGl0ZW0uaWNvbiBjbGFzc05hbWU9XCJtci00IGgtNiB3LTZcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIHtpdGVtLm5hbWV9XHJcbiAgICAgICAgICAgICAgICAgIDwvTGluaz5cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgfSl9XHJcbiAgICAgICAgICAgIDwvbmF2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgey8qIERlc2t0b3Agc2lkZWJhciAqL31cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRkZW4gbWQ6ZmxleCBtZDpmbGV4LXNocmluay0wXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHctNjRcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBoLTAgZmxleC0xIGJvcmRlci1yIGJvcmRlci1ncmF5LTIwMCBiZy13aGl0ZVwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sIHB0LTUgcGItNCBvdmVyZmxvdy15LWF1dG9cIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGZsZXgtc2hyaW5rLTAgcHgtNFwiPlxyXG4gICAgICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQteGwgZm9udC1ib2xkIHRleHQtZ3JheS05MDBcIj5JbnZlbnRvcnkgQUk8L2gxPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxuYXYgY2xhc3NOYW1lPVwibXQtNSBmbGV4LTEgcHgtMiBzcGFjZS15LTFcIj5cclxuICAgICAgICAgICAgICAgIHtuYXZpZ2F0aW9uLm1hcCgoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBpc0FjdGl2ZSA9IGxvY2F0aW9uLnBhdGhuYW1lID09PSBpdGVtLmhyZWY7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPExpbmtcclxuICAgICAgICAgICAgICAgICAgICAgIGtleT17aXRlbS5uYW1lfVxyXG4gICAgICAgICAgICAgICAgICAgICAgdG89e2l0ZW0uaHJlZn1cclxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YCR7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQWN0aXZlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctcHJpbWFyeS0xMDAgdGV4dC1wcmltYXJ5LTkwMCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICA6ICd0ZXh0LWdyYXktNjAwIGhvdmVyOmJnLWdyYXktNTAgaG92ZXI6dGV4dC1ncmF5LTkwMCdcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZ3JvdXAgZmxleCBpdGVtcy1jZW50ZXIgcHgtMiBweS0yIHRleHQtc20gZm9udC1tZWRpdW0gcm91bmRlZC1tZGB9XHJcbiAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGl0ZW0uaWNvbiBjbGFzc05hbWU9XCJtci0zIGgtNiB3LTZcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAge2l0ZW0ubmFtZX1cclxuICAgICAgICAgICAgICAgICAgICA8L0xpbms+XHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9KX1cclxuICAgICAgICAgICAgICA8L25hdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgICB7LyogTWFpbiBjb250ZW50ICovfVxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgdy0wIGZsZXgtMSBvdmVyZmxvdy1oaWRkZW5cIj5cclxuICAgICAgICB7LyogVG9wIG5hdmlnYXRpb24gKi99XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSB6LTEwIGZsZXgtc2hyaW5rLTAgZmxleCBoLTE2IGJnLXdoaXRlIHNoYWRvd1wiPlxyXG4gICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IGJvcmRlci1yIGJvcmRlci1ncmF5LTIwMCB0ZXh0LWdyYXktNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbnNldCBmb2N1czpyaW5nLXByaW1hcnktNTAwIG1kOmhpZGRlblwiXHJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNpZGViYXJPcGVuKHRydWUpfVxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICA8QmFyczNJY29uIGNsYXNzTmFtZT1cImgtNiB3LTZcIiAvPlxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBweC00IGZsZXgganVzdGlmeS1iZXR3ZWVuXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXhcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBmbGV4IG1kOm1sLTBcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgdy1mdWxsIHRleHQtZ3JheS00MDAgZm9jdXMtd2l0aGluOnRleHQtZ3JheS02MDBcIj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBoLTE2XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1zZW1pYm9sZCB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7bmF2aWdhdGlvbi5maW5kKGl0ZW0gPT4gaXRlbS5ocmVmID09PSBsb2NhdGlvbi5wYXRobmFtZSk/Lm5hbWUgfHwgJ0Rhc2hib2FyZCd9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9oMj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNCBmbGV4IGl0ZW1zLWNlbnRlciBtZDptbC02XCI+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTRcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktNzAwXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW1cIj57dXNlcj8uYXR0cmlidXRlcz8uZW1haWx9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWdyYXktNTAwXCI+e2dldFVzZXJSb2xlKHVzZXIpfTwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3NpZ25PdXR9XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlIHAtMSByb3VuZGVkLWZ1bGwgdGV4dC1ncmF5LTQwMCBob3Zlcjp0ZXh0LWdyYXktNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1vZmZzZXQtMiBmb2N1czpyaW5nLXByaW1hcnktNTAwXCJcclxuICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgPEFycm93UmlnaHRPblJlY3RhbmdsZUljb24gY2xhc3NOYW1lPVwiaC02IHctNlwiIC8+XHJcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgey8qIFBhZ2UgY29udGVudCAqL31cclxuICAgICAgICA8bWFpbiBjbGFzc05hbWU9XCJmbGV4LTEgcmVsYXRpdmUgb3ZlcmZsb3cteS1hdXRvIGZvY3VzOm91dGxpbmUtbm9uZVwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweS02XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LXctN3hsIG14LWF1dG8gcHgtNCBzbTpweC02IG1kOnB4LThcIj5cclxuICAgICAgICAgICAgICB7Y2hpbGRyZW59XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9tYWluPlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBMYXlvdXQ7Il19