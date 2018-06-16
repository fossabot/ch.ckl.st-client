import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
  HttpClientXsrfModule
} from "@angular/common/http";
import { ReactiveFormsModule } from "@angular/forms";

import { TagInputModule } from "ngx-chips";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./core/home/home.component";
import { LoginComponent } from "./user/login/login.component";
import { RegisterComponent } from "./user/register/register.component";
import { ClstCreateComponent } from "./checklist/clst-create/clst-create.component";
import { ClstFormComponent } from "./checklist/clst-form/clst-form.component";
import { ClstSectionComponent } from "./checklist/clst-section/clst-section.component";
import { ClstChecklistItemComponent } from "./checklist/clst-checklist-item/clst-checklist-item.component";
import { ClstChecklistItemTagEditComponent } from "./checklist/clst-checklist-item-tag-edit/clst-checklist-item-tag-edit.component";
import { ClstChecklistItemTagsComponent } from "./checklist/clst-checklist-item-tags/clst-checklist-item-tags.component";

import { FormElementPusherService } from "./checklist/form-element-pusher.service";
import { ServerConnectService } from "./shared/server-connect.service";
import { AuthenticationInterceptor } from "./shared/authentication.inteceptor";
import { ChecklistItemTagsSyncService } from "./shared/checklist-item-tags-sync.service";
import { DataPersistence } from "./shared/data-persistence.service";

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
    ClstChecklistItemTagsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: "XSRF-TOKEN",
      headerName: "X-XSRF-TOKEN"
    }),
    AppRoutingModule,
    ReactiveFormsModule,
    TagInputModule
  ],
  providers: [
    FormElementPusherService,
    ServerConnectService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true
    },
    ChecklistItemTagsSyncService,
    DataPersistence
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
