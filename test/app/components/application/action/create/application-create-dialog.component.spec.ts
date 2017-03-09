import { DebugElement, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { Response, ResponseOptions } from "@angular/http";
import { By } from "@angular/platform-browser";
import { Observable, Subject } from "rxjs";

import { ApplicationCreateDialogComponent } from "app/components/application/action";
import { NotificationService } from "app/components/base/notifications";
import { SidebarRef } from "app/components/base/sidebar";
import { ServerError } from "app/models";
import { ApplicationService, HttpUploadService } from "app/services";
import * as Fixtures from "test/fixture";
import * as TestConstants from "test/test-constants";
import { validateControl } from "test/utils/helpers";
import { MockedFile } from "test/utils/mocks";
import { CreateFormMockComponent, ServerErrorMockComponent } from "test/utils/mocks/components";

describe("ApplicationCreateDialogComponent ", () => {
    let fixture: ComponentFixture<ApplicationCreateDialogComponent>;
    let component: ApplicationCreateDialogComponent;
    let debugElement: DebugElement;
    let appServiceSpy: any;
    let uploadServiceSpy: any;
    let notificationServiceSpy: any;

    const validators = TestConstants.validators;

    beforeEach(() => {
        appServiceSpy = {
            put: jasmine.createSpy("put").and.callFake((applicationId, version) => {
                if (applicationId === "throw-me") {
                    const options = new ResponseOptions({
                        status: 400,
                        body: JSON.stringify({ message: "blast, we failed" }),
                        statusText: "error, error, error",
                    });

                    return Observable.throw(ServerError.fromARM(new Response(options)));
                }

                return Observable.of({ storageUrl: "https://some/url" });
            }),

            activatePackage: jasmine.createSpy("activatePackage").and.callFake((applicationId, version) => {
                if (applicationId === "activate-fail") {
                    const options = new ResponseOptions({
                        status: 400,
                        body: JSON.stringify({ message: "blast, we failed" }),
                        statusText: "error, error, error",
                    });

                    return Observable.throw(ServerError.fromARM(new Response(options)));
                }

                return Observable.of({});
            }),

            onApplicationAdded: new Subject(),
        };

        uploadServiceSpy = {
            putBlock: jasmine.createSpy("putBlock").and.callFake((sasUrl, options) => {
                return Observable.of({});
            }),

            commitBlockList: jasmine.createSpy("commitBlockList").and.callFake((sasUrl, options) => {
                return Observable.of({});
            }),
        };

        notificationServiceSpy = {
            success: jasmine.createSpy("success"),

            error: jasmine.createSpy("error"),
        };

        TestBed.configureTestingModule({
            declarations: [ApplicationCreateDialogComponent, CreateFormMockComponent, ServerErrorMockComponent],
            providers: [
                { provide: FormBuilder, useValue: new FormBuilder() },
                { provide: SidebarRef, useValue: null },
                { provide: ApplicationService, useValue: appServiceSpy },
                { provide: HttpUploadService, useValue: uploadServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        });

        fixture = TestBed.createComponent(ApplicationCreateDialogComponent);
        component = fixture.componentInstance;
        debugElement = fixture.debugElement;
        fixture.detectChanges();

        // applicationForm = component.applicationForm;
    });

    it("Should show title and description", () => {
        expect(debugElement.nativeElement.textContent).toContain("Create application package");
        expect(debugElement.nativeElement.textContent).toContain("Upload an application package"
            + " and give it an identifier to create your application");
    });

    describe("Application id", () => {
        it("control is initialized", () => {
            const input = debugElement.query(By.css("input[formControlName=id]")).nativeElement;
            expect(input).toBeDefined();
        });

        it("control has required validation", () => {
            validateControl(component.applicationForm, "id").fails(validators.required).with("");
            validateControl(component.applicationForm, "id").passes(validators.required).with("bob");
        });

        it("control has maxLength validation", () => {
            validateControl(component.applicationForm, "id").fails(validators.maxlength).with("a".repeat(65));
            validateControl(component.applicationForm, "id").passes(validators.maxlength).with("a".repeat(64));
        });

        it("control has pattern validation", () => {
            validateControl(component.applicationForm, "id").fails(validators.pattern).with("invalid app id");
            validateControl(component.applicationForm, "id").passes(validators.pattern).with("valid-id");
        });
    });

    describe("Package version", () => {
        it("control is initialized", () => {
            const input = debugElement.query(By.css("input[formControlName=version]")).nativeElement;
            expect(input).toBeDefined();
        });

        it("control has required validation", () => {
            validateControl(component.applicationForm, "version").fails(validators.required).with("");
            validateControl(component.applicationForm, "version").passes(validators.required).with("1");
        });

        it("control has maxLength validation", () => {
            validateControl(component.applicationForm, "version").fails(validators.maxlength).with("a".repeat(65));
            validateControl(component.applicationForm, "version").passes(validators.maxlength).with("a".repeat(64));
        });

        it("control has pattern validation", () => {
            validateControl(component.applicationForm, "version").fails(validators.pattern).with("1 2 1");
            validateControl(component.applicationForm, "version").passes(validators.pattern).with("1.2.1");
        });
    });

    describe("Package File", () => {
        it("control is initialized", () => {
            const input = debugElement.query(By.css("input[type=file]")).nativeElement;
            expect(input).toBeDefined();
        });

        it("control has required validation", () => {
            validateControl(component.applicationForm, "package").fails(validators.required).with("");
            validateControl(component.applicationForm, "package").passes(validators.required).with("bob.zip");
        });

        it("control has pattern validation", () => {
            validateControl(component.applicationForm, "package").fails(validators.pattern).with("file.text");
            validateControl(component.applicationForm, "package").passes(validators.pattern).with("file.zip");
        });
    });

    describe("Passing in application populates form", () => {
        beforeEach(() => {
            component.setValue(Fixtures.application.create({ id: "monkeys" }));
            fixture.detectChanges();
        });

        it("sets the application id", () => {
            expect(component.applicationForm.controls["id"].value).toBe("monkeys");
        });

        it("updates the description", () => {
            const description = "Upload a new package version for the selected application";
            expect(debugElement.nativeElement.textContent).toContain(description);
        });
    });

    describe("Passing in application and version populates form", () => {
        beforeEach(() => {
            component.setValue(Fixtures.application.create({ id: "more-monkeys" }), "12.5");
            fixture.detectChanges();
        });

        it("sets the application id", () => {
            expect(component.applicationForm.controls["id"].value).toBe("more-monkeys");
        });

        it("sets the version", () => {
            expect(component.applicationForm.controls["version"].value).toBe("12.5");
        });

        it("updates the description", () => {
            const description = "Select a new package to overwrite the existing version";
            expect(debugElement.nativeElement.textContent).toContain(description);
        });

        it("updates the title", () => {
            expect(debugElement.nativeElement.textContent).toContain("Update selected package");
        });
    });

    describe("Submitting action form", () => {
        beforeEach(() => {
            component.applicationForm.controls["id"].setValue("app-5");
            component.applicationForm.controls["version"].setValue("1.0");
            component.applicationForm.controls["package"].setValue("bob.zip");
            component.file = new MockedFile({
                name: "GreenButtonIntegrationTest-1.0.zip",
                path: "C:\Users\ascobie\Desktop\App Images\GreenButtonIntegrationTest-1.0.zip",
                lastModifiedDate: new Date(),
                type: "application/x-zip-compressed",
                webkitRelativePath: "",
                size: 2876,
            });

            fixture.detectChanges();
        });

        it("Clicking add creates and doesn't close sidebar", (done) => {
            component.submit().subscribe(() => {
                expect(appServiceSpy.put).toHaveBeenCalledTimes(1);
                expect(appServiceSpy.put).toHaveBeenCalledWith("app-5", "1.0");

                expect(uploadServiceSpy.putBlock).toHaveBeenCalledTimes(1);
                expect(uploadServiceSpy.commitBlockList).toHaveBeenCalledTimes(1);

                expect(appServiceSpy.activatePackage).toHaveBeenCalledTimes(1);
                expect(appServiceSpy.activatePackage).toHaveBeenCalledWith("app-5", "1.0");

                expect(notificationServiceSpy.error).toHaveBeenCalledTimes(0);
                expect(notificationServiceSpy.success).toHaveBeenCalledTimes(1);
                expect(notificationServiceSpy.success).toHaveBeenCalledWith(
                    "Application added!",
                    "Version 1.0 for application 'app-5' was successfully created!",
                );

                done();
            });

            appServiceSpy.onApplicationAdded.subscribe({
                next: (appId) => {
                    expect(appId).toEqual("app-5");
                },
            });
        });

        it("If create application throws we handle the error", (done) => {
            component.applicationForm.controls["id"].setValue("throw-me");
            fixture.detectChanges();

            component.submit().subscribe({
                next: () => {
                    fail("call should have failed");
                    done();
                },
                error: (error: ServerError) => {
                    expect(error.statusText).toBe("error, error, error");
                    expect(error.toString()).toBe("400 - blast, we failed");

                    expect(appServiceSpy.put).toHaveBeenCalledTimes(1);
                    expect(appServiceSpy.put).toHaveBeenCalledWith("throw-me", "1.0");

                    expect(uploadServiceSpy.putBlock).toHaveBeenCalledTimes(0);
                    expect(uploadServiceSpy.commitBlockList).toHaveBeenCalledTimes(0);
                    expect(appServiceSpy.activatePackage).toHaveBeenCalledTimes(0);
                    expect(notificationServiceSpy.success).toHaveBeenCalledTimes(0);

                    done();
                },
            });

            appServiceSpy.onApplicationAdded.subscribe({
                next: (appId) => {
                    fail("onApplicationAdded should not have been called");
                },
            });
        });

        it("If activate package throws we carry on and notify the user", (done) => {
            component.applicationForm.controls["id"].setValue("activate-fail");
            fixture.detectChanges();

            component.submit().subscribe({
                next: () => {
                    expect(appServiceSpy.put).toHaveBeenCalledTimes(1);
                    expect(appServiceSpy.put).toHaveBeenCalledWith("activate-fail", "1.0");
                    expect(uploadServiceSpy.putBlock).toHaveBeenCalledTimes(1);
                    expect(uploadServiceSpy.commitBlockList).toHaveBeenCalledTimes(1);
                    expect(appServiceSpy.activatePackage).toHaveBeenCalledTimes(1);
                    expect(notificationServiceSpy.success).toHaveBeenCalledTimes(0);
                    expect(notificationServiceSpy.error).toHaveBeenCalledTimes(1);
                    expect(notificationServiceSpy.error).toHaveBeenCalledWith(
                        "Activation failed",
                        "The application package was uploaded into storage successfully, "
                            + "but the activation process failed.",
                    );

                    done();
                },
                error: (error: ServerError) => {
                    fail("call should not have failed");
                    done();
                },
            });

            appServiceSpy.onApplicationAdded.subscribe({
                next: (appId) => {
                    expect(appId).toEqual("activate-fail");
                },
            });
        });
    });
});