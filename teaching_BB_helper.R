## plot beta distribution nicely
plot.beta <- function (a,b,...) {
  xs <- seq(0.01,.99,.01)
  ys <- dbeta(xs,a,b)
  ys <- ys / sum(ys) # normalize
  plot(xs,ys,bty="n",type="l",
       xaxp=c(0,1,2),yaxt="n",
       xlab="",ylab="",
       ...)
  midpoint <- xs[cumsum(ys)>.5][1]
  lines(c(midpoint,midpoint),c(0,1),lty=2,col="red")
}




## analytic version
student.loss <- function(a,b,c) {
  p <- dbetabinom.ab(1, 1, a, b)
  loss <- 1 - ((p * c) + ((1-p) * (1-c)))
  return(loss)
}

plot.loss <- function(a,b,...) {
  
  xs <- seq(0.01,.99,.01)
  n <- length(xs)
  ys <- mapply(student.loss,rep(a,n),
         rep(b,n),xs)
  
  
  plot(xs,ys,bty="n",type="l",
       xaxp=c(0,1,2),ylim=c(0,1),
       xlab="",ylab="",...)
  midpoint <- xs[ys==min(ys)][1]
  lines(c(midpoint,midpoint),c(0,1),lty=2,col="red")
}


# 
# ### info gain 
# info.gain <- function(a,b,h,t) {
#   xs <- seq(.01,.99,.01)
#   ys1 <- dbeta(xs,a,b)
#   ys2 <- dbeta(xs,a+h,b+t)
#   ys1 <- ys1 / sum(ys1) # normalize
#   ys2 <- ys2 / sum(ys2) # normalize
#   
#   loss <- array(length(ys1))
#   for (i in 1:length(ys1)) {
#     loss[i] <- ys2[i] * log2(ys2[i] / ys1[i])
#   }
#   
#   return(sum(loss))
# }


