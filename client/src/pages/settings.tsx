import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { updateUserProfileSchema, changePasswordSchema, type User, type UpdateUserProfile, type ChangePassword } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/theme-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotifications } from "@/contexts/notification-context";
import Header from "@/components/layout/header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  User as UserIcon, 
  Lock, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Save, 
  Shield,
  Bell,
  Settings as SettingsIcon,
  Loader2,
  Database
} from "lucide-react";
import { DataCleanupDialog } from "@/components/data-cleanup-dialog";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { settings: notificationSettings, updateSetting } = useNotifications();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user/profile"],
  });

  const profileForm = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      email: user?.email || "",
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      position: user?.position || "",
    },
  });

  const passwordForm = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: t("success"),
        description: t("profile-updated-success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("operation-error"),
        variant: "destructive",
      });
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: ChangePassword) => {
      const response = await apiRequest("POST", "/api/user/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: t("success"),
        description: t("password-changed-success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("operation-error"),
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: UpdateUserProfile) => {
    updateProfile.mutate(data);
  };

  const onPasswordSubmit = (data: ChangePassword) => {
    changePassword.mutate(data);
  };

  const getDepartmentLabel = (department: string) => {
    const labels = {
      logistica: "Logística",
      manutencao: "Manutenção",
      transporte: "Transporte",
      operacoes: "Operações",
      administracao: "Administração",
    };
    return labels[department as keyof typeof labels] || department;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Update form defaults when user data loads
  if (user && !profileForm.getValues().fullName) {
    profileForm.reset({
      email: user.email || "",
      fullName: user.fullName || "",
      phone: user.phone || "",
      position: user.position || "",
    });
  }

  if (isLoading) {
    return <LoadingSpinner message="Carregando configurações..." />;
  }

  return (
    <>
      <Header 
        title={t('settings')} 
        subtitle={t('manage-profile-preferences')} 
      />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
              <TabsTrigger value="security">{t('security')}</TabsTrigger>
              <TabsTrigger value="notifications">{t('notifications')}</TabsTrigger>
              <TabsTrigger value="system">{t('system')}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserIcon className="mr-2 h-5 w-5" />
                    {t('personal-info')}
                  </CardTitle>
                  <CardDescription>
                    {t('contact-info')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <UserIcon className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{user?.fullName || user?.username}</h3>
                          <p className="text-sm text-gray-600">@{user?.username}</p>
                          <Badge variant="secondary" className="mt-1">
                            {user?.role || "Funcionário"}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{user?.email || "Email não cadastrado"}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{user?.phone || "Telefone não cadastrado"}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{user?.position || "Cargo não definido"}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('full-name')} *</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('enter-full-name')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('email')}</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder={t('enter-email')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          

                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('phone')}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('enter-phone')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('position')}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('enter-position')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" disabled={updateProfile.isPending} className="w-full">
                            {updateProfile.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <Save className="mr-2 h-4 w-4" />
                            {t('save-changes')}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('account-info')}</CardTitle>
                  <CardDescription>{t('account-details')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('username')}</Label>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">{user?.username}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('account-created')}</Label>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">{user?.createdAt ? formatDate(user.createdAt) : "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('last-updated')}</Label>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">{user?.updatedAt ? formatDate(user.updatedAt) : "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="mr-2 h-5 w-5" />
                    {t('change-password-title')}
                  </CardTitle>
                  <CardDescription>
                    {t('keep-account-secure')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md">
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('current-password-label')} *</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder={t('current-password-placeholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('new-password-label')} *</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder={t('new-password-placeholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('confirm-new-password')} *</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder={t('confirm-password-placeholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={changePassword.isPending}>
                          {changePassword.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <Shield className="mr-2 h-4 w-4" />
                          {t('change-password-button')}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('security-tips')}</CardTitle>
                  <CardDescription>{t('keep-account-always-secure')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• {t('security-tip-1')}</li>
                    <li>• {t('security-tip-2')}</li>
                    <li>• {t('security-tip-3')}</li>
                    <li>• {t('security-tip-4')}</li>
                    <li>• {t('security-tip-5')}</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    {t('notification-settings-title')}
                  </CardTitle>
                  <CardDescription>
                    {t('configure-notifications')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t('new-requisitions-notif')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('new-requisitions-desc')}</p>
                      </div>
                      <Button 
                        variant={notificationSettings.newRequisitions ? "default" : "outline"} 
                        size="sm"
                        onClick={() => updateSetting('newRequisitions', !notificationSettings.newRequisitions)}
                      >
                        {notificationSettings.newRequisitions ? t('enabled') : t('disabled')}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t('pending-approvals-notif')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('pending-approvals-desc')}</p>
                      </div>
                      <Button 
                        variant={notificationSettings.pendingApprovals ? "default" : "outline"} 
                        size="sm"
                        onClick={() => updateSetting('pendingApprovals', !notificationSettings.pendingApprovals)}
                      >
                        {notificationSettings.pendingApprovals ? t('enabled') : t('disabled')}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t('requisition-status-notif')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('requisition-status-desc')}</p>
                      </div>
                      <Button 
                        variant={notificationSettings.requisitionStatus ? "default" : "outline"} 
                        size="sm"
                        onClick={() => updateSetting('requisitionStatus', !notificationSettings.requisitionStatus)}
                      >
                        {notificationSettings.requisitionStatus ? t('enabled') : t('disabled')}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t('monthly-reports-notif')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('monthly-reports-desc')}</p>
                      </div>
                      <Button 
                        variant={notificationSettings.monthlyReports ? "default" : "outline"} 
                        size="sm"
                        onClick={() => updateSetting('monthlyReports', !notificationSettings.monthlyReports)}
                      >
                        {notificationSettings.monthlyReports ? t('enabled') : t('disabled')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <SettingsIcon className="mr-2 h-5 w-5" />
                    {t('system-configurations')}
                  </CardTitle>
                  <CardDescription>
                    {t('customize-appearance-behavior')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t('theme-label')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('choose-theme')}</p>
                      </div>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">{t('light')}</SelectItem>
                          <SelectItem value="dark">{t('dark')}</SelectItem>
                          <SelectItem value="system">{t('system-theme')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t('language-label')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('system-interface-language')}</p>
                      </div>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português</SelectItem>
                          <SelectItem value="en-US">English</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t('date-format-label')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('how-dates-displayed')}</p>
                      </div>
                      <Select defaultValue="DD/MM/YYYY">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t('items-per-page-label')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{t('items-displayed-tables')}</p>
                      </div>
                      <Select defaultValue="20">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('about-system-title')}</CardTitle>
                  <CardDescription>{t('about-fuelcontrol')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{t('version-label')}:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{t('last-update-label')}:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Janeiro 2025</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{t('developed-by-label')}:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('fuelcontrol-team')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}