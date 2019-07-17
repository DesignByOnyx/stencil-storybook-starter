import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'simple-config',
  shadow: true
})
export class SimpleConfig {
  /**
   * A simple text field
   */
  @Prop() simpleText: string = "simple in the band!";

  /**
   * A simple number field
   */
  @Prop() aNumber: number = 555;

  /**
   * Another number field
   */
  @Prop() bNumber: number = 46;

  /**
   * A boolean field
   */
  @Prop() isChecked: boolean = true;

  /**
   * A date field
   */
  @Prop() startDate: string;

  /**
   * A string field which represents a color
   */
  @Prop() backgroundColor: string;

  /**
   * A poorly named field which should hold a color value
   */
  @Prop() poorlyNamedProp: string;

  render() {
    return (
      <dl>
        <dt>We've got:</dt>
        <dd>{this.simpleText}</dd>

        <dt>Backwards down the number line:</dt>
        <dd>{this.aNumber}</dd>

        <dt>Days 'till the coal ran out:</dt>
        <dd>{this.bNumber}</dd>

        <dt>Llama:</dt>
        <dd>{this.isChecked ? 'Taboot Taboot' : '(keep it on press)'}</dd>

        <dt>Time turns elastic:</dt>
        <dd>{this.startDate}</dd>

        <dt>Spewing forth their color:</dt>
        <dd style={{backgroundColor: this.backgroundColor || 'transparent'}}>{this.backgroundColor || '(none)'}</dd>

        <dt>Spectral colors in the void:</dt>
        <dd style={{backgroundColor: this.poorlyNamedProp || 'transparent'}}>{this.poorlyNamedProp || '(none)'}</dd>
      </dl>
    );
  }
}
