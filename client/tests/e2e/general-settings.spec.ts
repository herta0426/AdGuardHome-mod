import { test, expect } from '@playwright/test';
import { ADMIN_USERNAME, ADMIN_PASSWORD } from '../constants';

test.describe('General Settings', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login.html');
        await page.getByTestId('username').click();
        await page.getByTestId('username').fill(ADMIN_USERNAME);
        await page.getByTestId('password').click();
        await page.getByTestId('password').fill(ADMIN_PASSWORD);
        await page.keyboard.press('Tab');
        await page.getByTestId('sign_in').click();
        await page.waitForURL((url) => !url.href.endsWith('/login.html'));
    });

    test('should toggle query log configuration', async ({ page }) => {
        await page.goto('/#settings');

        const queryLogEnabled = page.getByTestId('logs_enabled');
        const queryLogEnabledLabel = queryLogEnabled.locator('xpath=following-sibling::*[1]');

        const initialState = await queryLogEnabled.isChecked();

        await queryLogEnabledLabel.click();
        await expect(queryLogEnabled).toBeChecked({ checked: !initialState });

        await queryLogEnabledLabel.click();
        await expect(queryLogEnabled).toBeChecked({ checked: initialState });
    });

    test('should toggle statistics configuration', async ({ page }) => {
        await page.goto('/#settings');

        const statisticsEnabled = page.getByTestId('stats_config_enabled');
        const statisticsEnabledLabel = statisticsEnabled.locator('xpath=following-sibling::*[1]');

        const initialState = await statisticsEnabled.isChecked();

        await statisticsEnabledLabel.click();
        await expect(statisticsEnabled).toBeChecked({ checked: !initialState });

        await statisticsEnabledLabel.click();
        await expect(statisticsEnabled).toBeChecked({ checked: initialState });
    });
});
