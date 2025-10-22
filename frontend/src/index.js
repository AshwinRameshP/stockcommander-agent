"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
require("./index.css");
const App_1 = __importDefault(require("./App"));
const root = client_1.default.createRoot(document.getElementById('root'));
root.render(<react_1.default.StrictMode>
    <App_1.default />
  </react_1.default.StrictMode>);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsOERBQXdDO0FBQ3hDLHVCQUFxQjtBQUNyQixnREFBd0I7QUFFeEIsTUFBTSxJQUFJLEdBQUcsZ0JBQVEsQ0FBQyxVQUFVLENBQzlCLFFBQVEsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFnQixDQUMvQyxDQUFDO0FBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FDVCxDQUFDLGVBQUssQ0FBQyxVQUFVLENBQ2Y7SUFBQSxDQUFDLGFBQUcsQ0FBQyxBQUFELEVBQ047RUFBQSxFQUFFLGVBQUssQ0FBQyxVQUFVLENBQUMsQ0FDcEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20vY2xpZW50JztcclxuaW1wb3J0ICcuL2luZGV4LmNzcyc7XHJcbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAnO1xyXG5cclxuY29uc3Qgcm9vdCA9IFJlYWN0RE9NLmNyZWF0ZVJvb3QoXHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKSBhcyBIVE1MRWxlbWVudFxyXG4pO1xyXG5yb290LnJlbmRlcihcclxuICA8UmVhY3QuU3RyaWN0TW9kZT5cclxuICAgIDxBcHAgLz5cclxuICA8L1JlYWN0LlN0cmljdE1vZGU+XHJcbik7Il19