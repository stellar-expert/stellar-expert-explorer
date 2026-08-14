/**
 * Sections of the billing dashboard, in menu order
 * @type {{link: String, title: String, icon: String}[]}
 */
export const userSections = [
    {link: 'overview', title: 'Overview', icon: 'icon-grid'},
    {link: 'api-keys', title: 'API keys', icon: 'icon-key'},
    {link: 'subscription', title: 'Subscription', icon: 'icon-calendar'},
    {link: 'billing-history', title: 'Billing history', icon: 'icon-back-in-time'}
]

/**
 * @type {{link: String, title: String, icon: String}[]}
 */
export const adminSections = [
    {link: 'dashboard', title: 'Dashboard', icon: 'icon-grid'},
    {link: 'user', title: 'Users', icon: 'icon-user-group'},
    {link: 'logs', title: 'Logs', icon: 'icon-document'}
]
