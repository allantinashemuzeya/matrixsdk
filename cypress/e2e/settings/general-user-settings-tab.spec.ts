/*
Copyright 2023 Suguru Hirahara

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/// <reference types="cypress" />

import { HomeserverInstance } from "../../plugins/utils/homeserver";

const USER_NAME = "Bob";
const USER_NAME_NEW = "Alice";
const IntegrationManager = "scalar.vector.im";

describe("General user settings tab", () => {
    let homeserver: HomeserverInstance;
    let userId: string;

    beforeEach(() => {
        cy.startHomeserver("default").then((data) => {
            homeserver = data;
            cy.initTestUser(homeserver, USER_NAME).then((user) => (userId = user.userId));
            cy.tweakConfig({ default_country_code: "US" }); // For checking the international country calling code
        });
        cy.openUserSettings("General");
    });

    afterEach(() => {
        cy.stopHomeserver(homeserver);
    });

    it("should be rendered properly", () => {
        // Exclude userId from snapshots
        const percyCSS = ".mx_ProfileSettings_profile_controls_userId { visibility: hidden !important; }";

        cy.get(".mx_SettingsTab.mx_GeneralUserSettingsTab").percySnapshotElement("User settings tab - General", {
            percyCSS,
        });

        cy.get(".mx_SettingsTab.mx_GeneralUserSettingsTab").within(() => {
            // Assert that the top heading is rendered
            cy.findByTestId("general").should("have.text", "General").should("be.visible");

            cy.get(".mx_ProfileSettings_profile")
                .scrollIntoView()
                .within(() => {
                    // Assert USER_NAME is rendered
                    cy.findByRole("textbox", { name: "Display Name" })
                        .get(`input[value='${USER_NAME}']`)
                        .should("be.visible");

                    // Assert that a userId is rendered
                    cy.get(".mx_ProfileSettings_profile_controls_userId").within(() => {
                        cy.findByText(userId).should("exist");
                    });

                    // Check avatar setting
                    cy.get(".mx_AvatarSetting_avatar")
                        .should("exist")
                        .realHover()
                        .get(".mx_AvatarSetting_avatar_hovering")
                        .within(() => {
                            // Hover effect
                            cy.get(".mx_AvatarSetting_hoverBg").should("exist");
                            cy.get(".mx_AvatarSetting_hover span").within(() => {
                                cy.findByText("Upload").should("exist");
                            });
                        });
                });

            // Wait until spinners disappear
            cy.get(".mx_GeneralUserSettingsTab_accountSection .mx_Spinner").should("not.exist");
            cy.get(".mx_GeneralUserSettingsTab_discovery .mx_Spinner").should("not.exist");

            cy.get(".mx_GeneralUserSettingsTab_accountSection").within(() => {
                // Assert that input areas for changing a password exists
                cy.get("form.mx_GeneralUserSettingsTab_changePassword")
                    .scrollIntoView()
                    .within(() => {
                        cy.findByLabelText("Current password").should("be.visible");
                        cy.findByLabelText("New Password").should("be.visible");
                        cy.findByLabelText("Confirm password").should("be.visible");
                    });

                // Check email addresses area
                cy.get(".mx_EmailAddresses")
                    .scrollIntoView()
                    .within(() => {
                        // Assert that an input area for a new email address is rendered
                        cy.findByRole("textbox", { name: "Email Address" }).should("be.visible");

                        // Assert the add button is visible
                        cy.findByRole("button", { name: "Add" }).should("be.visible");
                    });

                // Check phone numbers area
                cy.get(".mx_PhoneNumbers")
                    .scrollIntoView()
                    .within(() => {
                        // Assert that an input area for a new phone number is rendered
                        cy.findByRole("textbox", { name: "Phone Number" }).should("be.visible");

                        // Assert that the add button is rendered
                        cy.findByRole("button", { name: "Add" }).should("be.visible");
                    });
            });

            // Check language and region setting dropdown
            cy.get(".mx_GeneralUserSettingsTab_languageInput")
                .scrollIntoView()
                .within(() => {
                    // Check the default value
                    cy.findByText("English").should("be.visible");

                    // Click the button to display the dropdown menu
                    cy.findByRole("button", { name: "Language Dropdown" }).click();

                    // Assert that the default option is rendered and highlighted
                    cy.findByRole("option", { name: /Bahasa Indonesia/ })
                        .should("be.visible")
                        .should("have.class", "mx_Dropdown_option_highlight");

                    // Click again to close the dropdown
                    cy.findByRole("button", { name: "Language Dropdown" }).click();

                    // Assert that the default value is rendered again
                    cy.findByText("English").should("be.visible");
                });

            cy.get("form.mx_SetIdServer")
                .scrollIntoView()
                .within(() => {
                    // Assert that an input area for identity server exists
                    cy.findByRole("textbox", { name: "Enter a new identity server" }).should("be.visible");
                });

            cy.get(".mx_SetIntegrationManager")
                .scrollIntoView()
                .within(() => {
                    cy.contains(".mx_SetIntegrationManager_heading_manager", IntegrationManager).should("be.visible");

                    // Make sure integration manager's toggle switch is enabled
                    cy.get(".mx_ToggleSwitch_enabled").should("be.visible");

                    // Assert space between "Manage integrations" and the integration server address is set to 4px;
                    cy.get(".mx_SetIntegrationManager_heading_manager").should("have.css", "column-gap", "4px");

                    cy.get(".mx_SetIntegrationManager_heading_manager").within(() => {
                        cy.get(".mx_SettingsTab_heading").should("have.text", "Manage integrations");

                        // Assert the headings' inline end margin values are set to zero in favor of the column-gap declaration
                        cy.get(".mx_SettingsTab_heading").should("have.css", "margin-inline-end", "0px");
                        cy.get(".mx_SettingsTab_subheading").should("have.css", "margin-inline-end", "0px");
                    });
                });

            // Assert the account deactivation button is displayed
            cy.findByTestId("account-management-section")
                .scrollIntoView()
                .findByRole("button", { name: "Deactivate Account" })
                .should("be.visible")
                .should("have.class", "mx_AccessibleButton_kind_danger");
        });
    });

    it("should support adding and removing a profile picture", () => {
        cy.get(".mx_SettingsTab.mx_GeneralUserSettingsTab .mx_ProfileSettings").within(() => {
            // Upload a picture
            cy.get(".mx_ProfileSettings_avatarUpload").selectFile("cypress/fixtures/riot.png", { force: true });

            // Find and click "Remove" link button
            cy.get(".mx_ProfileSettings_profile").within(() => {
                cy.findByRole("button", { name: "Remove" }).click();
            });

            // Assert that the link button disappeared
            cy.get(".mx_AvatarSetting_avatar .mx_AccessibleButton_kind_link_sm").should("not.exist");
        });
    });

    it("should set a country calling code based on default_country_code", () => {
        // Check phone numbers area
        cy.get(".mx_PhoneNumbers")
            .scrollIntoView()
            .within(() => {
                // Assert that an input area for a new phone number is rendered
                cy.findByRole("textbox", { name: "Phone Number" }).should("be.visible");

                // Check a new phone number dropdown menu
                cy.get(".mx_PhoneNumbers_country")
                    .scrollIntoView()
                    .within(() => {
                        // Assert that the country calling code of United States is visible
                        cy.findByText(/\+1/).should("be.visible");

                        // Click the button to display the dropdown menu
                        cy.findByRole("button", { name: "Country Dropdown" }).click();

                        // Assert that the option for calling code of United Kingdom is visible
                        cy.findByRole("option", { name: /United Kingdom/ }).should("be.visible");

                        // Click again to close the dropdown
                        cy.findByRole("button", { name: "Country Dropdown" }).click();

                        // Assert that the default value is rendered again
                        cy.findByText(/\+1/).should("be.visible");
                    });

                cy.findByRole("button", { name: "Add" }).should("be.visible");
            });
    });

    it("should support changing a display name", () => {
        cy.get(".mx_SettingsTab.mx_GeneralUserSettingsTab .mx_ProfileSettings").within(() => {
            // Change the diaplay name to USER_NAME_NEW
            cy.findByRole("textbox", { name: "Display Name" }).type(`{selectAll}{del}${USER_NAME_NEW}{enter}`);
        });

        cy.closeDialog();

        // Assert the avatar's initial characters are set
        cy.get(".mx_UserMenu .mx_BaseAvatar_initial").findByText("A").should("exist"); // Alice
        cy.get(".mx_RoomView_wrapper .mx_BaseAvatar_initial").findByText("A").should("exist"); // Alice
    });
});