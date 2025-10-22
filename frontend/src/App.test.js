"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const react_router_dom_1 = require("react-router-dom");
const Dashboard_1 = __importDefault(require("./pages/Dashboard"));
// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
    Amplify: {
        configure: jest.fn(),
    },
}));
jest.mock('@aws-amplify/ui-react', () => ({
    Authenticator: ({ children }) => {
        const mockUser = {
            attributes: { email: 'test@example.com' },
            signInUserSession: {
                accessToken: {
                    payload: { 'cognito:groups': ['manager'] }
                }
            }
        };
        const mockSignOut = jest.fn();
        return children({ signOut: mockSignOut, user: mockUser });
    },
}));
test('renders dashboard page', () => {
    (0, react_2.render)(<react_router_dom_1.BrowserRouter>
      <Dashboard_1.default />
    </react_router_dom_1.BrowserRouter>);
    expect(react_2.screen.getByText('Dashboard Overview')).toBeInTheDocument();
    expect(react_2.screen.getByText('Total Inventory Value')).toBeInTheDocument();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBcHAudGVzdC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsa0RBQXdEO0FBQ3hELHVEQUFpRDtBQUNqRCxrRUFBMEM7QUFFMUMsbUJBQW1CO0FBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDOUIsT0FBTyxFQUFFO1FBQ1AsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7S0FDckI7Q0FDRixDQUFDLENBQUMsQ0FBQztBQUVKLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUN4QyxhQUFhLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBcUIsRUFBRSxFQUFFO1FBQ2pELE1BQU0sUUFBUSxHQUFHO1lBQ2YsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFO1lBQ3pDLGlCQUFpQixFQUFFO2dCQUNqQixXQUFXLEVBQUU7b0JBQ1gsT0FBTyxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRTtpQkFDM0M7YUFDRjtTQUNGLENBQUM7UUFDRixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDOUIsT0FBTyxRQUFRLENBQUMsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7Q0FDRixDQUFDLENBQUMsQ0FBQztBQUVKLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7SUFDbEMsSUFBQSxjQUFNLEVBQ0osQ0FBQyxnQ0FBYSxDQUNaO01BQUEsQ0FBQyxtQkFBUyxDQUFDLEFBQUQsRUFDWjtJQUFBLEVBQUUsZ0NBQWEsQ0FBQyxDQUNqQixDQUFDO0lBRUYsTUFBTSxDQUFDLGNBQU0sQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUM7SUFDbkUsTUFBTSxDQUFDLGNBQU0sQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDeEUsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyByZW5kZXIsIHNjcmVlbiB9IGZyb20gJ0B0ZXN0aW5nLWxpYnJhcnkvcmVhY3QnO1xyXG5pbXBvcnQgeyBCcm93c2VyUm91dGVyIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XHJcbmltcG9ydCBEYXNoYm9hcmQgZnJvbSAnLi9wYWdlcy9EYXNoYm9hcmQnO1xyXG5cclxuLy8gTW9jayBBV1MgQW1wbGlmeVxyXG5qZXN0Lm1vY2soJ2F3cy1hbXBsaWZ5JywgKCkgPT4gKHtcclxuICBBbXBsaWZ5OiB7XHJcbiAgICBjb25maWd1cmU6IGplc3QuZm4oKSxcclxuICB9LFxyXG59KSk7XHJcblxyXG5qZXN0Lm1vY2soJ0Bhd3MtYW1wbGlmeS91aS1yZWFjdCcsICgpID0+ICh7XHJcbiAgQXV0aGVudGljYXRvcjogKHsgY2hpbGRyZW4gfTogeyBjaGlsZHJlbjogYW55IH0pID0+IHtcclxuICAgIGNvbnN0IG1vY2tVc2VyID0ge1xyXG4gICAgICBhdHRyaWJ1dGVzOiB7IGVtYWlsOiAndGVzdEBleGFtcGxlLmNvbScgfSxcclxuICAgICAgc2lnbkluVXNlclNlc3Npb246IHtcclxuICAgICAgICBhY2Nlc3NUb2tlbjoge1xyXG4gICAgICAgICAgcGF5bG9hZDogeyAnY29nbml0bzpncm91cHMnOiBbJ21hbmFnZXInXSB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgY29uc3QgbW9ja1NpZ25PdXQgPSBqZXN0LmZuKCk7XHJcbiAgICByZXR1cm4gY2hpbGRyZW4oeyBzaWduT3V0OiBtb2NrU2lnbk91dCwgdXNlcjogbW9ja1VzZXIgfSk7XHJcbiAgfSxcclxufSkpO1xyXG5cclxudGVzdCgncmVuZGVycyBkYXNoYm9hcmQgcGFnZScsICgpID0+IHtcclxuICByZW5kZXIoXHJcbiAgICA8QnJvd3NlclJvdXRlcj5cclxuICAgICAgPERhc2hib2FyZCAvPlxyXG4gICAgPC9Ccm93c2VyUm91dGVyPlxyXG4gICk7XHJcbiAgXHJcbiAgZXhwZWN0KHNjcmVlbi5nZXRCeVRleHQoJ0Rhc2hib2FyZCBPdmVydmlldycpKS50b0JlSW5UaGVEb2N1bWVudCgpO1xyXG4gIGV4cGVjdChzY3JlZW4uZ2V0QnlUZXh0KCdUb3RhbCBJbnZlbnRvcnkgVmFsdWUnKSkudG9CZUluVGhlRG9jdW1lbnQoKTtcclxufSk7Il19