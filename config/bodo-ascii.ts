/**
 * Bodo as ASCII art — the mascot for the Markdown export (reportToMarkdown), where neither an
 * inline SVG nor a coloured disc can render. A fenced code block keeps the monospace alignment.
 *
 * Two-tone, derived from public/bodo.svg (the single source of truth for Bodo's art): the navy
 * body maps to '#', the cyan tail to '*', the white background to spaces — so Bodo's
 * iconic flat tail reads distinctly instead of washing out. 80 columns × 15 rows.
 *
 * Regenerate (when the art changes):
 *   rsvg-convert -w 1400 public/bodo.svg -o /tmp/b.png
 *   magick /tmp/b.png -background white -alpha remove -fuzz 8% -trim +repage /tmp/bt.png
 *   then sharp-resize to 80 cols and map navy→'#', cyan→'*'.
 */
export const BODO_ASCII = "                                     ################      #################\n                                 ############################################**\n                               ##############################################***\n                             #################################################**\n                            ###################################################\n                           ################################################  #\n                           ###################################################\n                          ##############################################   #\n                          #########################################\n  ***********             ###################### ######################\n******************        ####################### ######################\n***********************    ###################### ########    #  #######\n****************************##################### #####            #\n #*************************############################\n    ##*******************################################";
