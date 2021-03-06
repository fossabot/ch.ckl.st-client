import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { FormElementPusherService } from "../../../shared/form-element-pusher.service";
import {
  ChecklistItemTagsSyncService,
  ISyncTagsObs
} from "../../../shared/checklist-item-tags-sync.service";
import { genericValidationTest } from "../../../shared/clst-utils";
import { IChecklistItemTag } from "../../../shared/data-persistence.service";
import {
  ClstDialogComponent,
  IDialogBody
} from "../../../shared/dialog/clst-dialog/clst-dialog.component";

export interface ITagInfo {
  tag: IChecklistItemTag;
  index: number;
  delete?: boolean;
}

@Component({
  selector: "clst-checklist-item",
  templateUrl: "./clst-checklist-item.component.html",
  styleUrls: ["./clst-checklist-item.component.scss"]
})
export class ClstChecklistItemComponent implements OnInit, OnDestroy {
  @Input()
  public checklistItem: FormGroup;
  @Input()
  public checklistItemIndex: number;
  @Input()
  public section: FormGroup;

  public displayTagEditComp: boolean;
  public displayEditTagOptions: boolean;
  public tags: IChecklistItemTag[];
  public pushTagInfo: ITagInfo;
  public inFocusObs = new Subject<boolean>();

  public get checklistTagsEnabled(): FormArray {
    return this.checklistItem.get("checklistTagsEnabled") as FormArray;
  }

  private _destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private _fb: FormBuilder,
    private _fEPusherService: FormElementPusherService,
    private _syncTags: ChecklistItemTagsSyncService,
    public dialog: MatDialog
  ) {}

  public ngOnInit(): void {
    this.displayTagEditComp = false;
    this.displayEditTagOptions = false;

    this._syncTags.refreshTags();
    this._syncTags
      .observeTags()
      .pipe(takeUntil(this._destroy$))
      .subscribe((syncTags: ISyncTagsObs) => {
        this.tags = syncTags.tags;
        if (syncTags.hasOwnProperty("index")) {
          this.checklistTagsEnabled.removeAt(syncTags.index);
          if (this.pushTagInfo && this.pushTagInfo.index === syncTags.index) {
            this.clearTagEdit();
          }
          if (!this.tags.length) {
            this.displayEditTagOptions = false;
          }
        } else {
          const valLength = this.checklistTagsEnabled.controls.length;
          this.tags.forEach((t, i) => {
            if (i >= valLength) {
              this.checklistTagsEnabled.push(
                this._fb.group({
                  tag: false
                })
              );
            }
          });
        }
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }

  public testReq(formField: string): boolean {
    return genericValidationTest(this.checklistItem, formField, "required");
  }

  public addItem(index: number): void {
    this._fEPusherService.pushFormElement({
      type: "item",
      group: this.checklistItem,
      index: index
    });
  }

  public confirmItemDelete(index: number): void {
    const dialogBody: IDialogBody = {
      title: "Delete Checklist Item",
      body: "Are you sure?",
      buttons: {
        primary: {
          color: "warn",
          label: "Yes",
          value: true
        },
        secondary: {
          color: "primary",
          label: "No",
          value: false
        }
      }
    };

    const dialogRef = this.dialog.open(ClstDialogComponent, {
      height: "200px",
      width: "250px",
      data: dialogBody
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._removeItem(index);
      }
    });
  }

  private _removeItem(index: number): void {
    (<FormArray>this.section.controls["checklistItems"]).removeAt(index);
    if (!(<FormArray>this.section.controls["checklistItems"]).length) {
      this.addItem(0);
    }
  }

  public editTags(): void {
    this.displayEditTagOptions = !this.displayEditTagOptions;
    this.clearTagEdit();
  }

  public updateTag(i: number): void {
    this.clearTagEdit();
    this.displayTagEditComp = true;
    this.pushTagInfo = { tag: this.tags[i], index: i };
  }

  public clearTagEdit(): void {
    this.displayTagEditComp = false;
    this.pushTagInfo = null;
  }

  public deleteTag(i: number): void {
    this.clearTagEdit();
    this.displayTagEditComp = true;
    this.pushTagInfo = { tag: this.tags[i], index: i, delete: true };
  }

  public onBlur(): void {
    this.inFocusObs.next(false);
  }
}
