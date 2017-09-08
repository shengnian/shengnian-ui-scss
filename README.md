## 0 Useage
`$ git clone https://github.com/shengnian/shengnian-ui-react.git`
`$ cd shengnian-ui-react`
`gulp`

## 1 Fonts

### 1.1 Create functions
```
mkdir dist/scss/functions
touch dist/scss/functions/_functions.scss
```

### 1.1 Update loadFonts() to scss
`less/themes.less`

```less
.loadFonts() when (@importGoogleFonts) {
  @import url('@{googleProtocol}fonts.googleapis.com/css?family=@{googleFontRequest}');
}
```

to 

```scss
@mixin loadFonts() {
  @import url('#{$googleProtocol}fonts.googleapis.com/css?family=#{$googleFontRequest}');
}
```

Update `@include loadFonts();` to :

```scss
@if($importGoogleFonts) {
  @include loadFonts();
}
```

Update 
```scss
$imagePath : '../../themes/default/assets/images';
$fontPath  : '../../themes/default/assets/fonts';
```
to 

```scss
$imagePath : './assets/images';
$fontPath  : './assets/fonts';
```

## 2 Not found file

Delete `shengnian-ui.scss`
line 27 `@import './modules/chatroom';`
line 42 `@import './modules/video';`

## 2 Variables 

### 2.1 _site.scss
/*--- Colored Text ---*/  to  
/*--- Colored Headers ---*/


/*-------------------
        Grid
--------------------*/
to 
/*-------------------
    Border Radius
--------------------*/

/*-------------------
      Site Colors
--------------------*/
end of `$strongTransparentWhite     : rgba(255, 255, 255, 0.15);`
to 
/*-------------------
    Border Radius
--------------------*/

/*-------------------
        Paths
--------------------*/
to top

/*******************************
           Power-User
*******************************/
end of `$warningTextColor       : #573A08;`

to 
/*-------------------
    Border Radius
--------------------*/


/*-------------------
        Sizes
--------------------*/
to 
/*******************************
           Power-User
*******************************/


/*-------------------
  Exact Pixel Values
--------------------*/
to 
/*-------------------
    Border Radius
--------------------*/


/*-------------------
        Page
--------------------*/
to 
/*--------------
   Form Input
---------------*/

### 2.2 variables/collections/_form.scss

1.  `Errored Input` to `Inline Validation Prompt`


### 2.3 variables/collections/_menu.scss

1. `Menu Item ` to `Menu`

2. `Undefined variable: \"$menuSecondaryItemSpacing\",`
Down 3 lines :  
```scss
$menuSecondaryMargin: 0em -$menuSecondaryItemSpacing;
```

3. 
`$menuMinHeight: ($menuItemVerticalPadding * 2) + 1em;`
to
`$menuMinHeight: (#{$menuItemVerticalPadding} * 2) + 1em;` 


### 2.4 variables/elements/_button.scss
1. $buttonOrHeight: (#{$buttonVerticalPadding} * 2) + 1em;
2. $buttonLabeledIconWidth: 1em + (#{$buttonVerticalPadding} * 2);
3. $buttonCompactVerticalPadding: (#{$buttonVerticalPadding} * 0.75);
4. $buttonCompactHorizontalPadding: (#{$buttonHorizontalPadding} * 0.75);

### 2.5 variables/elements/_input.scss
1. $inputIconWidth: (#{$inputVerticalPadding} * 2) + $inputGlyphWidth;

### 2.6 variables/elements/_list.scss

1. Fix 
`$listHorizontalBulletSpacing: $listBulletDistance + 0.5em;` to `$listHorizontalBulletSpacing: $listBulletDistance + 0.5rem;`

### 2.7 variables/elements/_rail.scss

`$railDividingWidth: $railWidth + $railSplitDividingDistance;`
to
`$railDividingWidth: px2rem($railWidth) + $railSplitDividingDistance;`

### 2.8 variables/modules/_dropdown.scss
1. `Message` to `Search`

2. 
```scss
$dropdownSelectionItemDivider: 1px solid $dropdownSolidInternalBorderColor;
    $dropdownSelectionMessagePadding: $dropdownSelectionItemPadding;
```
 to 
 
 `$dropdownSelectionTransition: $dropdownTransition;`
 
3. `$dropdownItemLineHeight: 1em;` to `$dropdownItemLineHeight: 1rem;` 

4. `Incompatible units: 'em' and 'rem'` error: 
```scss
$dropdownItemVerticalPadding * 2
``` 
to 
```scss
#{$dropdownItemVerticalPadding} * 2
```

5. 
```scss
$dropdownPointingArrowOffset: -($dropdownPointingArrowSize / 2);
$dropdownPointingArrowDistanceFromEdge: 1em;
```
to 
`$dropdownPointingMenuDistance: $dropdownMini;`


### 2.9 variables/modules/_modal.scss

1. $modalInnerCloseTop: ($modalHeaderVerticalPadding - $modalCloseHitBoxOffset) + ($modalLineHeight - 1em)); 
$modalInnerCloseTop: ($modalHeaderVerticalPadding - $modalCloseHitBoxOffset + strip-units($modalLineHeight - 1em));

2. Incompatible units: '%' and 'em'.
`$modalMobileMargin: 0em 0em 0em -($modalMobileWidth / 2);` to 
`$modalMobileMargin: 0 0 0 -($modalMobileWidth / 2);`

### 2.10 variables/modules/_popup.scss"

1. ` Variations` to ` Parts`


### 2.11 variables/modules/_progress.scss
1. `Label` to top 


### 2.12 scss/globals/_site.scss

1. remove lastest `}` copy  `@include addScrollbars();`
into `@if ($useCustomScrollbars) {` block.
