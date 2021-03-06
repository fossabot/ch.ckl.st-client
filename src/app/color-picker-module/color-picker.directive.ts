import {
  Component,
  OnChanges,
  Directive,
  Input,
  Output,
  ViewContainerRef,
  ElementRef,
  EventEmitter,
  OnInit,
  ViewChild
} from "@angular/core";
import { ColorPickerService } from "./color-picker.service";
import { Rgba, Hsla, Hsva, SliderPosition, SliderDimension } from "./classes";
import { NgModule, Compiler, ReflectiveInjector } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

/* tslint:disable */
@Directive({
  selector: "[colorPicker]",
  host: {
    "(input)": "changeInput($event.target.value)",
    "(click)": "onClick()"
  }
})
export class ColorPickerDirective implements OnInit, OnChanges {
  @Input()
  colorPicker: string;
  @Output()
  colorPickerChange = new EventEmitter<string>(true);
  @Input()
  cpToggle: boolean;
  @Output()
  cpToggleChange = new EventEmitter<boolean>(true);
  @Input()
  cpPosition: string = "right";
  @Input()
  cpPositionOffset: string = "0%";
  @Input()
  cpPositionRelativeToArrow: boolean = false;
  @Input()
  cpOutputFormat: string = "hex";
  @Input()
  cpPresetLabel: string = "Preset colors";
  @Input()
  cpPresetColors: Array<string>;
  @Input()
  cpCancelButton: boolean = false;
  @Input()
  cpCancelButtonClass: string = "cp-cancel-button-class";
  @Input()
  cpCancelButtonText: string = "Cancel";
  @Input()
  cpOKButton: boolean = false;
  @Input()
  cpOKButtonClass: string = "cp-ok-button-class";
  @Input()
  cpOKButtonText: string = "OK";
  @Input()
  cpFallbackColor: string = "#fff";
  @Input()
  cpHeight: string = "auto";
  @Input()
  cpWidth: string = "230px";
  @Input()
  cpIgnoredElements: any = [];
  @Input()
  cpDialogDisplay: string = "popup";
  @Input()
  cpSaveClickOutside: boolean = true;
  @Input()
  cpAlphaChannel: string = "hex6";

  private dialog: any;
  private created: boolean;
  private ignoreChanges: boolean = false;

  constructor(
    private compiler: Compiler,
    private vcRef: ViewContainerRef,
    private el: ElementRef,
    private service: ColorPickerService
  ) {
    this.created = false;
  }

  ngOnChanges(changes: any): void {
    if (changes.cpToggle) {
      if (changes.cpToggle.currentValue) {
        this.openDialog();
      }
      if (!changes.cpToggle.currentValue && this.dialog) {
        this.dialog.closeColorPicker();
      }
    }
    if (changes.colorPicker) {
      if (this.dialog && !this.ignoreChanges) {
        if (this.cpDialogDisplay === "inline") {
          this.dialog.setInitialColor(changes.colorPicker.currentValue);
        }
        this.dialog.setColorFromString(changes.colorPicker.currentValue, false);
      }
      this.ignoreChanges = false;
    }
  }

  ngOnInit() {
    let hsva = this.service.stringToHsva(this.colorPicker);
    if (hsva === null) {
      hsva = this.service.stringToHsva(this.colorPicker, true);
    }
    if (hsva == null) {
      hsva = this.service.stringToHsva(this.cpFallbackColor);
    }
    this.colorPickerChange.emit(
      this.service.outputFormat(hsva, this.cpOutputFormat, this.cpAlphaChannel === "hex8")
    );
  }

  onClick() {
    if (this.cpIgnoredElements.filter((item: any) => item === this.el.nativeElement).length === 0) {
      this.openDialog();
    }
  }

  openDialog() {
    if (!this.created) {
      this.created = true;
      this.compiler.compileModuleAndAllComponentsAsync(DynamicCpModule).then(factory => {
        const compFactory = factory.componentFactories.find(
          x => x.componentType === DialogComponent
        );
        const injector = ReflectiveInjector.fromResolvedProviders([], this.vcRef.parentInjector);
        const cmpRef = this.vcRef.createComponent(compFactory, 0, injector, []);
        cmpRef.instance.setDialog(
          this,
          this.el,
          this.colorPicker,
          this.cpPosition,
          this.cpPositionOffset,
          this.cpPositionRelativeToArrow,
          this.cpOutputFormat,
          this.cpPresetLabel,
          this.cpPresetColors,
          this.cpCancelButton,
          this.cpCancelButtonClass,
          this.cpCancelButtonText,
          this.cpOKButton,
          this.cpOKButtonClass,
          this.cpOKButtonText,
          this.cpHeight,
          this.cpWidth,
          this.cpIgnoredElements,
          this.cpDialogDisplay,
          this.cpSaveClickOutside,
          this.cpAlphaChannel
        );
        this.dialog = cmpRef.instance;
      });
    } else if (this.dialog) {
      this.dialog.openDialog(this.colorPicker);
    }
  }

  colorChanged(value: string, ignore: boolean = true) {
    this.ignoreChanges = ignore;
    this.colorPickerChange.emit(value);
  }

  changeInput(value: string) {
    this.dialog.setColorFromString(value, true);
  }

  toggle(value: boolean) {
    this.cpToggleChange.emit(value);
  }
}

@Directive({
  selector: "[text]",
  host: {
    "(input)": "changeInput($event.target.value)"
  }
})
export class TextDirective {
  @Output()
  newValue = new EventEmitter<any>();
  @Input()
  text: any;
  @Input()
  rg: number;

  changeInput(value: string) {
    if (this.rg === undefined) {
      this.newValue.emit(value);
    } else {
      const numeric = parseFloat(value);
      if (!isNaN(numeric) && numeric >= 0 && numeric <= this.rg) {
        this.newValue.emit({ v: numeric, rg: this.rg });
      }
    }
  }
}

@Directive({
  selector: "[slider]",
  host: {
    "(mousedown)": "start($event)",
    "(touchstart)": "start($event)"
  }
})
export class SliderDirective {
  @Output()
  newValue = new EventEmitter<any>();
  @Input()
  slider: string;
  @Input()
  rgX: number;
  @Input()
  rgY: number;
  private listenerMove: any;
  private listenerStop: any;

  constructor(private el: ElementRef) {
    this.listenerMove = (event: any) => {
      this.move(event);
    };
    this.listenerStop = () => {
      this.stop();
    };
  }

  setCursor(event: any) {
    const height = this.el.nativeElement.offsetHeight;
    const width = this.el.nativeElement.offsetWidth;
    const x = Math.max(0, Math.min(this.getX(event), width));
    const y = Math.max(0, Math.min(this.getY(event), height));

    if (this.rgX !== undefined && this.rgY !== undefined) {
      this.newValue.emit({
        s: x / width,
        v: 1 - y / height,
        rgX: this.rgX,
        rgY: this.rgY
      });
    } else if (this.rgX === undefined && this.rgY !== undefined) {
      // ready to use vertical sliders
      this.newValue.emit({ v: y / height, rg: this.rgY });
    } else {
      this.newValue.emit({ v: x / width, rg: this.rgX });
    }
  }

  move(event: any) {
    event.preventDefault();
    this.setCursor(event);
  }

  start(event: any) {
    this.setCursor(event);
    document.addEventListener("mousemove", this.listenerMove);
    document.addEventListener("touchmove", this.listenerMove);
    document.addEventListener("mouseup", this.listenerStop);
    document.addEventListener("touchend", this.listenerStop);
  }

  stop() {
    document.removeEventListener("mousemove", this.listenerMove);
    document.removeEventListener("touchmove", this.listenerMove);
    document.removeEventListener("mouseup", this.listenerStop);
    document.removeEventListener("touchend", this.listenerStop);
  }

  getX(event: any): number {
    return (
      (event.pageX !== undefined ? event.pageX : event.touches[0].pageX) -
      this.el.nativeElement.getBoundingClientRect().left -
      window.pageXOffset
    );
  }
  getY(event: any): number {
    return (
      (event.pageY !== undefined ? event.pageY : event.touches[0].pageY) -
      this.el.nativeElement.getBoundingClientRect().top -
      window.pageYOffset
    );
  }
}

@Component({
  selector: "color-picker",
  templateUrl: "./templates/default/color-picker.html",
  styleUrls: ["./templates/default/color-picker.scss"]
})
export class DialogComponent implements OnInit {
  public hsva: Hsva;
  public rgbaText: Rgba;
  public hslaText: Hsla;
  public hexText: string;
  public outputColor: string;
  public selectedColor: string;
  public alphaSliderColor: string;
  public hueSliderColor: string;
  public slider: SliderPosition;
  public sliderDimMax: SliderDimension;
  public format: number;
  public show: boolean;
  public top: number;
  public left: number;
  public position: string;
  public directiveInstance: any;
  public initialColor: string;
  public directiveElementRef: ElementRef;

  public listenerMouseDown: any;
  public listenerResize: any;

  public cpPosition: string;
  public cpPositionOffset: number;
  public cpOutputFormat: string;
  public cpPresetLabel: string;
  public cpPresetColors: Array<string>;
  public cpCancelButton: boolean;
  public cpCancelButtonClass: string;
  public cpCancelButtonText: string;
  public cpOKButton: boolean;
  public cpOKButtonClass: string;
  public cpOKButtonText: string;
  public cpHeight: number;
  public cpWidth: number;
  public cpIgnoredElements: any;
  public cpDialogDisplay: string;
  public cpSaveClickOutside: boolean;
  public cpAlphaChannel: string;

  public dialogArrowSize: number = 10;
  public dialogArrowOffset: number = 15;
  public arrowTop: number;

  @ViewChild("hueSlider")
  hueSlider: any;
  @ViewChild("alphaSlider")
  alphaSlider: any;

  @ViewChild("dialogPopup")
  dialogElement: any;

  constructor(private el: ElementRef, private service: ColorPickerService) {}

  setDialog(
    instance: any,
    elementRef: ElementRef,
    color: any,
    cpPosition: string,
    cpPositionOffset: string,
    cpPositionRelativeToArrow: boolean,
    cpOutputFormat: string,
    cpPresetLabel: string,
    cpPresetColors: Array<string>,
    cpCancelButton: boolean,
    cpCancelButtonClass: string,
    cpCancelButtonText: string,
    cpOKButton: boolean,
    cpOKButtonClass: string,
    cpOKButtonText: string,
    cpHeight: string,
    cpWidth: string,
    cpIgnoredElements: any,
    cpDialogDisplay: string,
    cpSaveClickOutside: boolean,
    cpAlphaChannel: string
  ) {
    this.directiveInstance = instance;
    this.initialColor = color;
    this.directiveElementRef = elementRef;
    this.cpPosition = cpPosition;
    this.cpPositionOffset = parseInt(cpPositionOffset);
    if (!cpPositionRelativeToArrow) {
      this.dialogArrowOffset = 0;
    }
    this.cpOutputFormat = cpOutputFormat;
    this.cpPresetLabel = cpPresetLabel;
    this.cpPresetColors = cpPresetColors;
    this.cpCancelButton = cpCancelButton;
    this.cpCancelButtonClass = cpCancelButtonClass;
    this.cpCancelButtonText = cpCancelButtonText;
    this.cpOKButton = cpOKButton;
    this.cpOKButtonClass = cpOKButtonClass;
    this.cpOKButtonText = cpOKButtonText;
    this.cpHeight = parseInt(cpHeight);
    this.cpWidth = parseInt(cpWidth);
    this.cpIgnoredElements = cpIgnoredElements;
    this.cpDialogDisplay = cpDialogDisplay;
    if (this.cpDialogDisplay === "inline") {
      this.dialogArrowOffset = 0;
      this.dialogArrowSize = 0;
    }
    this.cpSaveClickOutside = cpSaveClickOutside;
    this.cpAlphaChannel = cpAlphaChannel;
  }

  ngOnInit() {
    const alphaWidth = this.alphaSlider.nativeElement.offsetWidth;
    const hueWidth = this.hueSlider.nativeElement.offsetWidth;
    this.sliderDimMax = new SliderDimension(hueWidth, this.cpWidth, 130, alphaWidth);
    this.slider = new SliderPosition(0, 0, 0, 0);
    if (this.cpOutputFormat === "rgba") {
      this.format = 1;
    } else if (this.cpOutputFormat === "hsla") {
      this.format = 2;
    } else {
      this.format = 0;
    }
    this.listenerMouseDown = (event: any) => {
      this.onMouseDown(event);
    };
    this.listenerResize = () => {
      this.onResize();
    };
    this.openDialog(this.initialColor, false);
  }

  setInitialColor(color: any) {
    this.initialColor = color;
  }

  openDialog(color: any, emit: boolean = true) {
    this.setInitialColor(color);
    this.setColorFromString(color, emit);
    this.openColorPicker();
  }

  cancelColor() {
    this.setColorFromString(this.initialColor, true);
    if (this.cpDialogDisplay === "popup") {
      this.directiveInstance.colorChanged(this.initialColor, true);
      this.closeColorPicker();
    }
  }

  oKColor() {
    if (this.cpDialogDisplay === "popup") {
      this.closeColorPicker();
    }
  }

  setColorFromString(value: string, emit: boolean = true) {
    let hsva: Hsva;
    if (this.cpAlphaChannel === "hex8") {
      hsva = this.service.stringToHsva(value, true);
      if (!hsva && !this.hsva) {
        hsva = this.service.stringToHsva(value, false);
      }
    } else {
      hsva = this.service.stringToHsva(value, false);
    }
    if (hsva) {
      this.hsva = hsva;
      this.update(emit);
    }
  }

  onMouseDown(event: any) {
    if (
      !this.isDescendant(this.el.nativeElement, event.target) &&
      event.target !== this.directiveElementRef.nativeElement &&
      this.cpIgnoredElements.filter((item: any) => item === event.target).length === 0 &&
      this.cpDialogDisplay === "popup"
    ) {
      if (!this.cpSaveClickOutside) {
        this.setColorFromString(this.initialColor, false);
        this.directiveInstance.colorChanged(this.initialColor);
      }
      this.closeColorPicker();
    }
  }

  openColorPicker() {
    if (!this.show) {
      this.setDialogPosition();
      this.show = true;
      this.directiveInstance.toggle(true);
      document.addEventListener("mousedown", this.listenerMouseDown);
      window.addEventListener("resize", this.listenerResize);
    }
  }

  closeColorPicker() {
    if (this.show) {
      this.show = false;
      this.directiveInstance.toggle(false);
      document.removeEventListener("mousedown", this.listenerMouseDown);
      window.removeEventListener("resize", this.listenerResize);
    }
  }

  onResize() {
    if (this.position === "fixed") {
      this.setDialogPosition();
    }
  }

  setDialogPosition() {
    const dialogHeight = this.dialogElement.nativeElement.offsetHeight;
    let node = this.directiveElementRef.nativeElement,
      position = "static";
    let parentNode: any = null;
    let boxDirective = null;
    while (node !== null && node.tagName !== "HTML") {
      position = window.getComputedStyle(node).getPropertyValue("position");
      if (position !== "static" && parentNode === null) {
        parentNode = node;
      }
      if (position === "fixed") {
        break;
      }
      node = node.parentNode;
    }
    if (position !== "fixed") {
      boxDirective = this.createBox(this.directiveElementRef.nativeElement, true);
      if (parentNode === null) {
        parentNode = node;
      }
      const boxParent = this.createBox(parentNode, true);
      this.top = boxDirective.top - boxParent.top;
      this.left = boxDirective.left - boxParent.left;
    } else {
      boxDirective = this.createBox(this.directiveElementRef.nativeElement, false);
      this.top = boxDirective.top;
      this.left = boxDirective.left;
      this.position = "fixed";
    }
    if (this.cpPosition === "left") {
      this.top += (boxDirective.height * this.cpPositionOffset) / 100 - this.dialogArrowOffset;
      this.left -= this.cpWidth + this.dialogArrowSize - 2;
    } else if (this.cpPosition === "top") {
      this.top -= dialogHeight + this.dialogArrowSize;
      this.left += (this.cpPositionOffset / 100) * boxDirective.width - this.dialogArrowOffset;
      this.arrowTop = dialogHeight - 1;
    } else if (this.cpPosition === "bottom") {
      this.top += boxDirective.height + this.dialogArrowSize;
      this.left += (this.cpPositionOffset / 100) * boxDirective.width - this.dialogArrowOffset;
    } else {
      this.top += (boxDirective.height * this.cpPositionOffset) / 100 - this.dialogArrowOffset;
      this.left += boxDirective.width + this.dialogArrowSize;
    }
  }

  setSaturation(val: { v: number; rg: number }) {
    const hsla = this.service.hsva2hsla(this.hsva);
    hsla.s = val.v / val.rg;
    this.hsva = this.service.hsla2hsva(hsla);
    this.update();
  }

  setLightness(val: { v: number; rg: number }) {
    const hsla = this.service.hsva2hsla(this.hsva);
    hsla.l = val.v / val.rg;
    this.hsva = this.service.hsla2hsva(hsla);
    this.update();
  }

  setHue(val: { v: number; rg: number }) {
    this.hsva.h = val.v / val.rg;
    this.update();
  }

  setAlpha(val: { v: number; rg: number }) {
    this.hsva.a = val.v / val.rg;
    this.update();
  }

  setR(val: { v: number; rg: number }) {
    const rgba = this.service.hsvaToRgba(this.hsva);
    rgba.r = val.v / val.rg;
    this.hsva = this.service.rgbaToHsva(rgba);
    this.update();
  }
  setG(val: { v: number; rg: number }) {
    const rgba = this.service.hsvaToRgba(this.hsva);
    rgba.g = val.v / val.rg;
    this.hsva = this.service.rgbaToHsva(rgba);
    this.update();
  }
  setB(val: { v: number; rg: number }) {
    const rgba = this.service.hsvaToRgba(this.hsva);
    rgba.b = val.v / val.rg;
    this.hsva = this.service.rgbaToHsva(rgba);
    this.update();
  }

  setSaturationAndBrightness(val: { s: number; v: number; rgX: number; rgY: number }) {
    this.hsva.s = val.s / val.rgX;
    this.hsva.v = val.v / val.rgY;
    this.update();
  }

  formatPolicy(): number {
    this.format = (this.format + 1) % 3;
    if (this.format === 0 && this.hsva.a < 1 && this.cpAlphaChannel === "hex6") {
      this.format++;
    }
    return this.format;
  }

  update(emit: boolean = true) {
    const hsla = this.service.hsva2hsla(this.hsva);
    const rgba = this.service.denormalizeRGBA(this.service.hsvaToRgba(this.hsva));
    const hueRgba = this.service.denormalizeRGBA(
      this.service.hsvaToRgba(new Hsva(this.hsva.h, 1, 1, 1))
    );

    this.hslaText = new Hsla(
      Math.round(hsla.h * 360),
      Math.round(hsla.s * 100),
      Math.round(hsla.l * 100),
      Math.round(hsla.a * 100) / 100
    );
    this.rgbaText = new Rgba(rgba.r, rgba.g, rgba.b, Math.round(rgba.a * 100) / 100);
    this.hexText = this.service.hexText(rgba, this.cpAlphaChannel === "hex8");

    this.alphaSliderColor = "rgb(" + rgba.r + "," + rgba.g + "," + rgba.b + ")";
    this.hueSliderColor = "rgb(" + hueRgba.r + "," + hueRgba.g + "," + hueRgba.b + ")";

    if (this.format === 0 && this.hsva.a < 1 && this.cpAlphaChannel === "hex6") {
      this.format++;
    }

    const lastOutput = this.outputColor;
    this.outputColor = this.service.outputFormat(
      this.hsva,
      this.cpOutputFormat,
      this.cpAlphaChannel === "hex8"
    );
    this.selectedColor = this.service.outputFormat(this.hsva, "rgba", false);

    this.slider = new SliderPosition(
      this.hsva.h * this.sliderDimMax.h - 8,
      this.hsva.s * this.sliderDimMax.s - 8,
      (1 - this.hsva.v) * this.sliderDimMax.v - 8,
      this.hsva.a * this.sliderDimMax.a - 8
    );

    if (emit && lastOutput !== this.outputColor) {
      this.directiveInstance.colorChanged(this.outputColor);
    }
  }

  isDescendant(parent: any, child: any): boolean {
    let node: any = child.parentNode;
    while (node !== null) {
      if (node === parent) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  createBox(element: any, offset: boolean): any {
    return {
      top: element.getBoundingClientRect().top + (offset ? window.pageYOffset : 0),
      left: element.getBoundingClientRect().left + (offset ? window.pageXOffset : 0),
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  }
}

@NgModule({
  imports: [BrowserModule],
  declarations: [DialogComponent, TextDirective, SliderDirective]
})
class DynamicCpModule {}
