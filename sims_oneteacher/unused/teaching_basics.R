sizes <- c(1,2,5,10,20,50,100)
reps <- 100

maxs <- matrix(nrow=length(sizes),ncol=reps)
for (i in 1:length(sizes)) {
  for (j in 1:reps) {
    maxs[i,j] <- max(rnorm(sizes[i]))
  }
}

qplot(sizes,rowMeans(maxs),geom="line")