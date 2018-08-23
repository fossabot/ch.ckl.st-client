import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
  HttpClientXsrfModule
} from "@angular/common/http";
import { ReactiveFormsModule } from "@angular/forms";
import { NgMaterialModule } from "./material.module";

import { TagInputModule } from "ngx-chips";
import { ToastrModule } from "ngx-toastr";
import { AutosizeModule } from "ngx-autosize";
import { ColorPickerModule } from "./color-picker-module/color-picker.module";
import { ClipboardModule } from "ngx-clipboard";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./core/home/home.component";
import { LoginComponent } from "./user/login/login.component";
import { RegisterComponent } from "./user/register/register.component";
import { ClstCreateComponent } from "./checklist/edit/clst-create/clst-create.component";
import { ClstFormComponent } from "./checklist/edit/clst-form/clst-form.component";
import { ClstSectionComponent } from "./checklist/edit/clst-section/clst-section.component";
import { ClstChecklistItemComponent } from "./checklist/edit/clst-checklist-item/clst-checklist-item.component";
import { ClstChecklistItemTagEditComponent } from "./checklist/edit/clst-checklist-item-tag-edit/clst-checklist-item-tag-edit.component";
import { ClstTagDisplayComponent } from "./checklist/clst-tag-display/clst-tag-display.component";
import { DashboardComponent } from "./user/dashboard/dashboard.component";
import { ClstUseRootComponent } from "./checklist/use/clst-use-root/clst-use-root.component";
import { ClstUseSectionComponent } from "./checklist/use/clst-use-section/clst-use-section.component";
import { ClstUseChecklistItemComponent } from "./checklist/use/clst-use-checklist-item/clst-use-checklist-item.component";
import { ClstSharePreviewComponent } from "./checklist/share/clst-share-preview/clst-share-preview.component";

import { SubmitButtonDirective } from "./shared/submit-button.directive";
import { SubmitIfValidDirective } from "./shared/submit-if-valid.directive";

import { AuthenticationInterceptor } from "./shared/authentication.inteceptor";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    ClstCreateComponent,
    ClstFormComponent,
    ClstSectionComponent,
    ClstChecklistItemComponent,
    ClstChecklistItemTagEditComponent,
    SubmitIfValidDirective,
    ClstTagDisplayComponent,
    DashboardComponent,
    ClstUseRootComponent,
    ClstUseSectionComponent,
    ClstUseChecklistItemComponent,
    SubmitButtonDirective,
    ClstSharePreviewComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: "toast-top-full-width"
    }),
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: "XSRF-TOKEN",
      headerName: "X-XSRF-TOKEN"
    }),
    AppRoutingModule,
    ReactiveFormsModule,
    NgMaterialModule,
    TagInputModule,
    AutosizeModule,
    ColorPickerModule,
    ClipboardModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
