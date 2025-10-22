"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Settings = () => {
    return (<div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure system preferences and user settings
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Notifications
            </label>
            <div className="mt-1">
              <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" defaultChecked/>
              <span className="ml-2 text-sm text-gray-600">
                Receive email alerts for low stock levels
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Dashboard Refresh Rate
            </label>
            <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
              <option>Every 5 minutes</option>
              <option>Every 15 minutes</option>
              <option>Every 30 minutes</option>
              <option>Every hour</option>
            </select>
          </div>
        </div>
      </div>
    </div>);
};
exports.default = Settings;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFFMUIsTUFBTSxRQUFRLEdBQWEsR0FBRyxFQUFFO0lBQzlCLE9BQU8sQ0FDTCxDQUFDLEdBQUcsQ0FDRjtNQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQ25CO1FBQUEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLGtDQUFrQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQzdEO1FBQUEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLDRCQUE0QixDQUN2Qzs7UUFDRixFQUFFLENBQUMsQ0FDTDtNQUFBLEVBQUUsR0FBRyxDQUVMOztNQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxnQ0FBZ0MsQ0FDN0M7UUFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsd0NBQXdDLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUMzRTtRQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQ3hCO1VBQUEsQ0FBQyxHQUFHLENBQ0Y7WUFBQSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMseUNBQXlDLENBQ3hEOztZQUNGLEVBQUUsS0FBSyxDQUNQO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FDbkI7Y0FBQSxDQUFDLEtBQUssQ0FDSixJQUFJLENBQUMsVUFBVSxDQUNmLFNBQVMsQ0FBQyx5RUFBeUUsQ0FDbkYsY0FBYyxFQUVoQjtjQUFBLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyw0QkFBNEIsQ0FDMUM7O2NBQ0YsRUFBRSxJQUFJLENBQ1I7WUFBQSxFQUFFLEdBQUcsQ0FDUDtVQUFBLEVBQUUsR0FBRyxDQUNMO1VBQUEsQ0FBQyxHQUFHLENBQ0Y7WUFBQSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMseUNBQXlDLENBQ3hEOztZQUNGLEVBQUUsS0FBSyxDQUNQO1lBQUEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLHNKQUFzSixDQUN0SztjQUFBLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQy9CO2NBQUEsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUNoQztjQUFBLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FDaEM7Y0FBQSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUM1QjtZQUFBLEVBQUUsTUFBTSxDQUNWO1VBQUEsRUFBRSxHQUFHLENBQ1A7UUFBQSxFQUFFLEdBQUcsQ0FDUDtNQUFBLEVBQUUsR0FBRyxDQUNQO0lBQUEsRUFBRSxHQUFHLENBQUMsQ0FDUCxDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBRUYsa0JBQWUsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbmNvbnN0IFNldHRpbmdzOiBSZWFjdC5GQyA9ICgpID0+IHtcclxuICByZXR1cm4gKFxyXG4gICAgPGRpdj5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi04XCI+XHJcbiAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LWdyYXktOTAwXCI+U2V0dGluZ3M8L2gxPlxyXG4gICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTIgdGV4dC1zbSB0ZXh0LWdyYXktNzAwXCI+XHJcbiAgICAgICAgICBDb25maWd1cmUgc3lzdGVtIHByZWZlcmVuY2VzIGFuZCB1c2VyIHNldHRpbmdzXHJcbiAgICAgICAgPC9wPlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgc2hhZG93IHJvdW5kZWQtbGcgcC02XCI+XHJcbiAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTkwMCBtYi00XCI+VXNlciBQcmVmZXJlbmNlczwvaDM+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cclxuICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS03MDBcIj5cclxuICAgICAgICAgICAgICBFbWFpbCBOb3RpZmljYXRpb25zXHJcbiAgICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMVwiPlxyXG4gICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImgtNCB3LTQgdGV4dC1wcmltYXJ5LTYwMCBmb2N1czpyaW5nLXByaW1hcnktNTAwIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkXCJcclxuICAgICAgICAgICAgICAgIGRlZmF1bHRDaGVja2VkXHJcbiAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC0yIHRleHQtc20gdGV4dC1ncmF5LTYwMFwiPlxyXG4gICAgICAgICAgICAgICAgUmVjZWl2ZSBlbWFpbCBhbGVydHMgZm9yIGxvdyBzdG9jayBsZXZlbHNcclxuICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwXCI+XHJcbiAgICAgICAgICAgICAgRGFzaGJvYXJkIFJlZnJlc2ggUmF0ZVxyXG4gICAgICAgICAgICA8L2xhYmVsPlxyXG4gICAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT1cIm10LTEgYmxvY2sgdy1mdWxsIHBsLTMgcHItMTAgcHktMiB0ZXh0LWJhc2UgYm9yZGVyLWdyYXktMzAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLXByaW1hcnktNTAwIGZvY3VzOmJvcmRlci1wcmltYXJ5LTUwMCBzbTp0ZXh0LXNtIHJvdW5kZWQtbWRcIj5cclxuICAgICAgICAgICAgICA8b3B0aW9uPkV2ZXJ5IDUgbWludXRlczwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgIDxvcHRpb24+RXZlcnkgMTUgbWludXRlczwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgIDxvcHRpb24+RXZlcnkgMzAgbWludXRlczwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgIDxvcHRpb24+RXZlcnkgaG91cjwvb3B0aW9uPlxyXG4gICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTZXR0aW5nczsiXX0=