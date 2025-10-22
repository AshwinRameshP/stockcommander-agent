"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const aws_amplify_1 = require("aws-amplify");
const ui_react_1 = require("@aws-amplify/ui-react");
require("@aws-amplify/ui-react/styles.css");
const Layout_1 = __importDefault(require("./components/Layout"));
const Dashboard_1 = __importDefault(require("./pages/Dashboard"));
const Inventory_1 = __importDefault(require("./pages/Inventory"));
const Recommendations_1 = __importDefault(require("./pages/Recommendations"));
const Analytics_1 = __importDefault(require("./pages/Analytics"));
const Settings_1 = __importDefault(require("./pages/Settings"));
// AWS Amplify configuration
aws_amplify_1.Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_example',
            userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'example',
        }
    },
    API: {
        REST: {
            inventoryAPI: {
                endpoint: process.env.REACT_APP_API_ENDPOINT || 'https://api.example.com',
                region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
            }
        }
    }
});
function App() {
    return (<ui_react_1.Authenticator>
      {({ signOut, user }) => (<react_router_dom_1.BrowserRouter>
          <Layout_1.default user={user} signOut={signOut}>
            <react_router_dom_1.Routes>
              <react_router_dom_1.Route path="/" element={<Dashboard_1.default />}/>
              <react_router_dom_1.Route path="/inventory" element={<Inventory_1.default />}/>
              <react_router_dom_1.Route path="/recommendations" element={<Recommendations_1.default />}/>
              <react_router_dom_1.Route path="/analytics" element={<Analytics_1.default />}/>
              <react_router_dom_1.Route path="/settings" element={<Settings_1.default />}/>
            </react_router_dom_1.Routes>
          </Layout_1.default>
        </react_router_dom_1.BrowserRouter>)}
    </ui_react_1.Authenticator>);
}
exports.default = App;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGtEQUEwQjtBQUMxQix1REFBMEU7QUFDMUUsNkNBQXNDO0FBQ3RDLG9EQUFzRDtBQUN0RCw0Q0FBMEM7QUFDMUMsaUVBQXlDO0FBQ3pDLGtFQUEwQztBQUMxQyxrRUFBMEM7QUFDMUMsOEVBQXNEO0FBQ3RELGtFQUEwQztBQUMxQyxnRUFBd0M7QUFFeEMsNEJBQTRCO0FBQzVCLHFCQUFPLENBQUMsU0FBUyxDQUFDO0lBQ2hCLElBQUksRUFBRTtRQUNKLE9BQU8sRUFBRTtZQUNQLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixJQUFJLG1CQUFtQjtZQUNyRSxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixJQUFJLFNBQVM7U0FDekU7S0FDRjtJQUNELEdBQUcsRUFBRTtRQUNILElBQUksRUFBRTtZQUNKLFlBQVksRUFBRTtnQkFDWixRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsSUFBSSx5QkFBeUI7Z0JBQ3pFLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLFdBQVc7YUFDeEQ7U0FDRjtLQUNGO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsU0FBUyxHQUFHO0lBQ1YsT0FBTyxDQUNMLENBQUMsd0JBQWEsQ0FDWjtNQUFBLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FDdEIsQ0FBQyxnQ0FBTSxDQUNMO1VBQUEsQ0FBQyxnQkFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUNuQztZQUFBLENBQUMseUJBQU0sQ0FDTDtjQUFBLENBQUMsd0JBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsbUJBQVMsQ0FBQyxBQUFELEVBQUcsQ0FBQyxFQUN2QztjQUFBLENBQUMsd0JBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsbUJBQVMsQ0FBQyxBQUFELEVBQUcsQ0FBQyxFQUNoRDtjQUFBLENBQUMsd0JBQUssQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyx5QkFBZSxDQUFDLEFBQUQsRUFBRyxDQUFDLEVBQzVEO2NBQUEsQ0FBQyx3QkFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxtQkFBUyxDQUFDLEFBQUQsRUFBRyxDQUFDLEVBQ2hEO2NBQUEsQ0FBQyx3QkFBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxrQkFBUSxDQUFDLEFBQUQsRUFBRyxDQUFDLEVBQ2hEO1lBQUEsRUFBRSx5QkFBTSxDQUNWO1VBQUEsRUFBRSxnQkFBTSxDQUNWO1FBQUEsRUFBRSxnQ0FBTSxDQUFDLENBQ1YsQ0FDSDtJQUFBLEVBQUUsd0JBQWEsQ0FBQyxDQUNqQixDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IEJyb3dzZXJSb3V0ZXIgYXMgUm91dGVyLCBSb3V0ZXMsIFJvdXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XHJcbmltcG9ydCB7IEFtcGxpZnkgfSBmcm9tICdhd3MtYW1wbGlmeSc7XHJcbmltcG9ydCB7IEF1dGhlbnRpY2F0b3IgfSBmcm9tICdAYXdzLWFtcGxpZnkvdWktcmVhY3QnO1xyXG5pbXBvcnQgJ0Bhd3MtYW1wbGlmeS91aS1yZWFjdC9zdHlsZXMuY3NzJztcclxuaW1wb3J0IExheW91dCBmcm9tICcuL2NvbXBvbmVudHMvTGF5b3V0JztcclxuaW1wb3J0IERhc2hib2FyZCBmcm9tICcuL3BhZ2VzL0Rhc2hib2FyZCc7XHJcbmltcG9ydCBJbnZlbnRvcnkgZnJvbSAnLi9wYWdlcy9JbnZlbnRvcnknO1xyXG5pbXBvcnQgUmVjb21tZW5kYXRpb25zIGZyb20gJy4vcGFnZXMvUmVjb21tZW5kYXRpb25zJztcclxuaW1wb3J0IEFuYWx5dGljcyBmcm9tICcuL3BhZ2VzL0FuYWx5dGljcyc7XHJcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL3BhZ2VzL1NldHRpbmdzJztcclxuXHJcbi8vIEFXUyBBbXBsaWZ5IGNvbmZpZ3VyYXRpb25cclxuQW1wbGlmeS5jb25maWd1cmUoe1xyXG4gIEF1dGg6IHtcclxuICAgIENvZ25pdG86IHtcclxuICAgICAgdXNlclBvb2xJZDogcHJvY2Vzcy5lbnYuUkVBQ1RfQVBQX1VTRVJfUE9PTF9JRCB8fCAndXMtZWFzdC0xX2V4YW1wbGUnLFxyXG4gICAgICB1c2VyUG9vbENsaWVudElkOiBwcm9jZXNzLmVudi5SRUFDVF9BUFBfVVNFUl9QT09MX0NMSUVOVF9JRCB8fCAnZXhhbXBsZScsXHJcbiAgICB9XHJcbiAgfSxcclxuICBBUEk6IHtcclxuICAgIFJFU1Q6IHtcclxuICAgICAgaW52ZW50b3J5QVBJOiB7XHJcbiAgICAgICAgZW5kcG9pbnQ6IHByb2Nlc3MuZW52LlJFQUNUX0FQUF9BUElfRU5EUE9JTlQgfHwgJ2h0dHBzOi8vYXBpLmV4YW1wbGUuY29tJyxcclxuICAgICAgICByZWdpb246IHByb2Nlc3MuZW52LlJFQUNUX0FQUF9BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnLFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuXHJcbmZ1bmN0aW9uIEFwcCgpIHtcclxuICByZXR1cm4gKFxyXG4gICAgPEF1dGhlbnRpY2F0b3I+XHJcbiAgICAgIHsoeyBzaWduT3V0LCB1c2VyIH0pID0+IChcclxuICAgICAgICA8Um91dGVyPlxyXG4gICAgICAgICAgPExheW91dCB1c2VyPXt1c2VyfSBzaWduT3V0PXtzaWduT3V0fT5cclxuICAgICAgICAgICAgPFJvdXRlcz5cclxuICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9cIiBlbGVtZW50PXs8RGFzaGJvYXJkIC8+fSAvPlxyXG4gICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL2ludmVudG9yeVwiIGVsZW1lbnQ9ezxJbnZlbnRvcnkgLz59IC8+XHJcbiAgICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvcmVjb21tZW5kYXRpb25zXCIgZWxlbWVudD17PFJlY29tbWVuZGF0aW9ucyAvPn0gLz5cclxuICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9hbmFseXRpY3NcIiBlbGVtZW50PXs8QW5hbHl0aWNzIC8+fSAvPlxyXG4gICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL3NldHRpbmdzXCIgZWxlbWVudD17PFNldHRpbmdzIC8+fSAvPlxyXG4gICAgICAgICAgICA8L1JvdXRlcz5cclxuICAgICAgICAgIDwvTGF5b3V0PlxyXG4gICAgICAgIDwvUm91dGVyPlxyXG4gICAgICApfVxyXG4gICAgPC9BdXRoZW50aWNhdG9yPlxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEFwcDsiXX0=