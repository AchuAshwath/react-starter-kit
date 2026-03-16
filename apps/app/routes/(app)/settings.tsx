import { auth } from "@/lib/auth";
import { useBillingQuery } from "@/lib/queries/billing";
import { useSessionQuery } from "@/lib/queries/session";
import { type ThemePreference, useTheme } from "@/lib/theme";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Switch,
} from "@repo/ui";
import { useCallback, useId, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CreditCard,
  Monitor,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
} from "lucide-react";

export const Route = createFileRoute("/(app)/settings")({
  component: Settings,
});

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function Settings() {
  const { preference, setPreference } = useTheme();
  const themeOptionRef = useRef<Array<HTMLButtonElement | null>>([]);
  const themeLabelId = useId();

  const setOptionRef = useCallback(
    (index: number, el: HTMLButtonElement | null) => {
      themeOptionRef.current[index] = el;
    },
    [],
  );

  const handleThemeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const isNextKey = event.key === "ArrowRight" || event.key === "ArrowDown";
      const isPrevKey = event.key === "ArrowLeft" || event.key === "ArrowUp";

      if (
        !isNextKey &&
        !isPrevKey &&
        event.key !== "Home" &&
        event.key !== "End"
      ) {
        return;
      }

      event.preventDefault();

      let nextIndex = index;

      if (isNextKey) {
        nextIndex = (index + 1) % THEME_OPTIONS.length;
      } else if (isPrevKey) {
        nextIndex = (index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = THEME_OPTIONS.length - 1;
      }

      const nextOption = THEME_OPTIONS[nextIndex];
      setPreference(nextOption.value);
      themeOptionRef.current[nextIndex]?.focus();
    },
    [setPreference],
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>
              Update your personal information and profile settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Billing */}
        <BillingCard />

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch id="email-notifications" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <Switch id="push-notifications" />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your security preferences and authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline">Change Password</Button>
            </div>
            <div className="space-y-2">
              <Button variant="outline">
                Enable Two-Factor Authentication
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize the look and feel of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label id={themeLabelId}>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose light, dark, or follow your OS setting.
                </p>
              </div>
              <div
                role="radiogroup"
                aria-labelledby={themeLabelId}
                className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1"
              >
                {THEME_OPTIONS.map((option, index) => {
                  const Icon = option.icon;
                  const isSelected = preference === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      ref={(el) => setOptionRef(index, el)}
                      onClick={() => setPreference(option.value)}
                      onKeyDown={(event) => handleThemeKeyDown(event, index)}
                      tabIndex={isSelected ? 0 : -1}
                      className={[
                        "inline-flex size-11 cursor-pointer items-center justify-center rounded-md border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                      title={option.label}
                      aria-label={option.label}
                      aria-checked={isSelected}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BillingCard() {
  const { data: session } = useSessionQuery();
  const activeOrgId = session?.session?.activeOrganizationId;
  const { data: billing, isLoading } = useBillingQuery(activeOrgId);

  const returnUrl = window.location.href;

  async function handleUpgrade(plan: "starter" | "pro") {
    try {
      await auth.subscription.upgrade({
        plan,
        successUrl: returnUrl,
        cancelUrl: returnUrl,
      });
    } catch (error) {
      console.error("Failed to start upgrade:", error);
    }
  }

  async function handleManageBilling() {
    try {
      await auth.subscription.billingPortal({ returnUrl });
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    }
  }

  const hasSubscription =
    billing?.status === "active" || billing?.status === "trialing";
  const isCanceling = hasSubscription && billing.cancelAtPeriodEnd;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <CardTitle>Billing</CardTitle>
        </div>
        <CardDescription>
          Manage your subscription and billing details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : hasSubscription ? (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)}{" "}
                plan
                <span className="ml-2 text-xs text-muted-foreground">
                  ({billing.status})
                </span>
              </p>
              {billing.periodEnd && (
                <p className="text-sm text-muted-foreground">
                  {isCanceling ? "Access until" : "Renews on"}{" "}
                  {new Date(billing.periodEnd).toLocaleDateString()}
                </p>
              )}
              {isCanceling && (
                <p className="text-sm text-amber-600">
                  Your subscription will not renew. You can restore it from the
                  billing portal.
                </p>
              )}
            </div>
            <Button variant="outline" onClick={handleManageBilling}>
              Manage Billing
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are on the Free plan.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleUpgrade("starter")}
              >
                Upgrade to Starter
              </Button>
              <Button onClick={() => handleUpgrade("pro")}>
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
