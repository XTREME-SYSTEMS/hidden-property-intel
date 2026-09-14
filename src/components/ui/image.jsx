import * as React from "react"
import { useSize } from "@/hooks/use-size"
import { cn } from "@/lib/utils"
import {
  buildSrcSet,
  buildTransformUrl,
  DEFAULT_TRANSFORM_WIDTH,
  getOriginalImageUrl,
  IMAGE_LOAD_MODE,
  nextImageLoadMode,
  parseWixMediaUrl,
} from "./image-helpers"

const FALLBACK_IMAGE_URL =
  "https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png"

function shouldBypassRemoteImage(src) {
  if (typeof src !== "string" || !src) return false

  try {
    const url = new URL(src)
    const host = url.hostname.toLowerCase()
    const path = url.pathname.toLowerCase()
    const propertyOnionHost = host === "propertyonion.com" || host.endsWith(".propertyonion.com")

    if (
      propertyOnionHost &&
      (path.startsWith("/assets/header/logo") ||
        path.startsWith("/assets/images/icon-") ||
        path.startsWith("/assets/academy/banner-"))
    ) {
      return true
    }

    if (host === "maps.googleapis.com" && path === "/maps/api/streetview") {
      return true
    }

    return false
  } catch {
    return false
  }
}

/** @typedef {React.HTMLAttributes<HTMLSpanElement> & { aspectRatio?: string | number }} ImageWrapperProps */
/** @type {React.ForwardRefExoticComponent<ImageWrapperProps & React.RefAttributes<HTMLSpanElement>>} */
const ImageWrapper = React.forwardRef(({ aspectRatio, className, style, children, ...props }, ref) => (
  <span ref={ref} className={cn("inline-block relative", className)} style={{ aspectRatio, ...style }} {...props}>
    {children}
  </span>
))
ImageWrapper.displayName = "ImageWrapper"

/** @typedef {React.ImgHTMLAttributes<HTMLImageElement> & { parsed: any, fittingType?: string, focalPoint?: {x:number,y:number}, quality?: number, aspectRatio?: string }} ResponsiveImageProps */
/** @type {React.ForwardRefExoticComponent<ResponsiveImageProps & React.RefAttributes<HTMLImageElement>>} */
const ResponsiveImage = React.forwardRef(
  ({ parsed, fittingType = "fill", focalPoint, quality = 90, className, style, aspectRatio, onLoad, ...props }, parentRef) => {
    const wrapperRef = React.useRef(null)
    const imgRef = React.useRef(null)
    const size = useSize(wrapperRef)
    const [loaded, setLoaded] = React.useState(false)

    React.useImperativeHandle(parentRef, () => imgRef.current)
    React.useEffect(() => { setLoaded(false) }, [parsed.baseUrl])

    const crop = fittingType !== "fit"
    const options = size && {
      width: size.width || DEFAULT_TRANSFORM_WIDTH,
      height: size.height ? size.height : undefined,
      crop,
      focalPoint: crop ? focalPoint : undefined,
      quality,
    }

    return (
      <ImageWrapper ref={wrapperRef} aspectRatio={aspectRatio} className={className} style={style}>
        {options && !loaded && (
          <img
            src={buildTransformUrl(parsed, {
              ...options,
              width: 20,
              height: options.height ? Math.max(1, Math.round((20 * options.height) / options.width)) : undefined,
              quality: 20,
            })}
            alt=""
            aria-hidden="true"
            className="w-full h-full inset-0 absolute"
            style={{ objectFit: fittingType === "fit" ? "contain" : "cover", filter: "blur(10px)", transform: "scale(1.1)" }}
          />
        )}
        {options && (
          <img
            ref={imgRef}
            src={buildTransformUrl(parsed, options)}
            srcSet={buildSrcSet(parsed, options)}
            loading="lazy"
            className={cn("w-full h-full inset-0 absolute", fittingType === "fit" ? "object-contain" : "object-cover")}
            onLoad={(e) => { setLoaded(true); onLoad?.(e) }}
            {...props}
          />
        )}
      </ImageWrapper>
    )
  }
)
ResponsiveImage.displayName = "ResponsiveImage"

/** @typedef {React.ImgHTMLAttributes<HTMLImageElement> & { fittingType?: string, originWidth?: number, originHeight?: number, focalPointX?: number, focalPointY?: number, quality?: number }} ImageProps */
/** @type {React.ForwardRefExoticComponent<ImageProps & React.RefAttributes<HTMLImageElement>>} */
const Image = React.forwardRef(
  ({ src, fittingType = "fill", originWidth, originHeight, focalPointX, focalPointY, quality = 90, onError, ...props }, ref) => {
    const blockedRemoteImage = shouldBypassRemoteImage(src)
    const effectiveSrc = blockedRemoteImage ? "" : src
    const parsedSource = effectiveSrc && effectiveSrc !== FALLBACK_IMAGE_URL ? parseWixMediaUrl(effectiveSrc) : null
    const initialMode = parsedSource ? IMAGE_LOAD_MODE.OPTIMIZED : IMAGE_LOAD_MODE.ORIGINAL
    const [loadState, setLoadState] = React.useState({ src: effectiveSrc, mode: initialMode })
    const mode = loadState.src === effectiveSrc ? loadState.mode : initialMode

    React.useEffect(() => { setLoadState({ src: effectiveSrc, mode: initialMode }) }, [effectiveSrc, initialMode])

    const handleError = (event) => {
      if (mode === IMAGE_LOAD_MODE.FALLBACK) return
      const nextMode = nextImageLoadMode(mode)
      setLoadState({ src: effectiveSrc, mode: nextMode })
      if (nextMode === IMAGE_LOAD_MODE.FALLBACK) onError?.(event)
    }

    const imageProps = { ...props, onError: handleError }

    if (!effectiveSrc) {
      return (
        <img
          ref={ref}
          src={FALLBACK_IMAGE_URL}
          {...imageProps}
          data-empty-image
          data-blocked-remote-image={blockedRemoteImage || undefined}
        />
      )
    }

    const parsed = mode === IMAGE_LOAD_MODE.OPTIMIZED ? parsedSource : null
    if (!parsed) {
      const isErrorMode = mode === IMAGE_LOAD_MODE.FALLBACK
      const imageSrc = isErrorMode ? FALLBACK_IMAGE_URL : getOriginalImageUrl(effectiveSrc, parsedSource)
      return <img ref={ref} src={imageSrc} {...imageProps} data-error-image={isErrorMode || undefined} />
    }

    const focalPoint = typeof focalPointX === "number" && typeof focalPointY === "number" ? { x: focalPointX, y: focalPointY } : undefined
    const aspectRatio = originWidth && originHeight ? `${originWidth} / ${originHeight}` : undefined

    return <ResponsiveImage ref={ref} parsed={parsed} fittingType={fittingType} focalPoint={focalPoint} quality={quality} aspectRatio={aspectRatio} {...imageProps} />
  }
)
Image.displayName = "Image"

export { Image }
